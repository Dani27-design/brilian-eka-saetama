import {
  applyIntervalReschedulePlan,
  buildIntervalReschedulePlan,
  RescheduleApplyError,
  StaleReschedulePlanError,
} from "./maintenanceIntervalRescheduler";

type MockDocData = Record<string, any>;

const mockStore: Record<string, Record<string, MockDocData>> = {
  products: {},
  contracts: {},
};
let mockMaintenances: Array<{ id: string; data: MockDocData }> = [];
let mockAutoIdCounter = 0;
const mockBatch = {
  update: jest.fn(),
  delete: jest.fn(),
  set: jest.fn(),
  commit: jest.fn(async () => undefined),
};
const mockWriteBatch = jest.fn(() => mockBatch);

jest.mock("@/db/firebase/firebaseConfig", () => ({
  firestore: {},
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn((_firestore, collectionName: string) => ({
    collectionName,
  })),
  doc: jest.fn((firestoreOrCollection, collectionName?: string, id?: string) => {
    if (collectionName === undefined) {
      mockAutoIdCounter += 1;
      return {
        collectionName: firestoreOrCollection.collectionName,
        id: `auto-${mockAutoIdCounter}`,
      };
    }

    return {
      collectionName,
      id,
    };
  }),
  getDoc: jest.fn(async (ref: { collectionName: string; id: string }) => {
    const data = mockStore[ref.collectionName]?.[ref.id];
    return {
      id: ref.id,
      exists: () => Boolean(data),
      data: () => data,
    };
  }),
  getDocs: jest.fn(async (queryRef: any) => {
    const contractConstraint = queryRef.constraints.find(
      (constraint: any) => constraint.field === "contract",
    );
    const productConstraint = queryRef.constraints.find(
      (constraint: any) => constraint.field === "product",
    );

    const docs = mockMaintenances
      .filter(({ data }) => {
        const contractMatches =
          !contractConstraint || data.contract?.id === contractConstraint.value.id;
        const productMatches =
          !productConstraint || data.product?.id === productConstraint.value.id;
        return contractMatches && productMatches;
      })
      .map(({ id, data }) => ({
        id,
        data: () => data,
      }));

    return { docs };
  }),
  query: jest.fn((collectionRef: any, ...constraints: any[]) => ({
    collectionRef,
    constraints,
  })),
  where: jest.fn((field: string, operator: string, value: any) => ({
    field,
    operator,
    value,
  })),
  serverTimestamp: jest.fn(() => ({ __serverTimestamp: true })),
  Timestamp: {
    fromDate: (date: Date) => ({ toDate: () => date }),
  },
  writeBatch: jest.fn(() => mockWriteBatch()),
}));

function ref(collectionName: string, id: string) {
  return { collectionName, id };
}

function timestamp(date: string) {
  return {
    toDate: () => new Date(date),
  };
}

function seedMaintenance(id: string, data: MockDocData) {
  mockMaintenances.push({ id, data });
}

function seedMaintenanceContext(overrides: Partial<MockDocData> = {}) {
  mockStore.products.productA = {
    name: "APAR Lobby",
    productNumber: 101,
    productType: "APAR",
    maintenanceInterval: 30,
    contract: ref("contracts", "contractA"),
    ...overrides.product,
  };
  mockStore.contracts.contractA = {
    contractNumber: "CTR-001",
    contractName: "Maintenance Gedung A",
    contractType: "maintenance",
    endDate: timestamp("2026-10-31"),
    products: [ref("products", "productA")],
    ...overrides.contract,
  };
}

function planInput(overrides = {}) {
  return {
    productId: "productA",
    oldInterval: 30,
    newInterval: 14,
    changedAt: new Date("2026-07-15"),
    mode: "future_only" as const,
    ...overrides,
  };
}

function activeCutPlanInput(overrides = {}) {
  return planInput({
    oldInterval: 120,
    newInterval: 60,
    changedAt: new Date("2026-07-14"),
    mode: "cut_active_period_once" as const,
    ...overrides,
  });
}

describe("maintenanceIntervalRescheduler", () => {
  beforeEach(() => {
    mockStore.products = {};
    mockStore.contracts = {};
    mockMaintenances = [];
    mockAutoIdCounter = 0;
    mockBatch.update.mockClear();
    mockBatch.delete.mockClear();
    mockBatch.set.mockClear();
    mockBatch.commit.mockClear();
    mockWriteBatch.mockClear();
  });

  it("blocks invalid new maintenance interval before reading Firestore", async () => {
    const plan = await buildIntervalReschedulePlan(planInput({ newInterval: 0 }));

    expect(plan.canApply).toBe(false);
    expect(plan.applyBlockedReason).toBe("Interval maintenance baru tidak valid.");
    expect(plan.writeSummary.estimatedWrites).toBe(0);
  });

  it("blocks when product is not found", async () => {
    const plan = await buildIntervalReschedulePlan(planInput());

    expect(plan.canApply).toBe(false);
    expect(plan.applyBlockedReason).toBe("Produk tidak ditemukan.");
    expect(plan.productId).toBe("productA");
  });

  it("blocks when product has no contract reference", async () => {
    seedMaintenanceContext({ product: { contract: null } });

    const plan = await buildIntervalReschedulePlan(planInput());

    expect(plan.canApply).toBe(false);
    expect(plan.applyBlockedReason).toBe("Produk tidak memiliki kontrak.");
    expect(plan.productName).toBe("APAR Lobby");
  });

  it("blocks when product contract is not a maintenance contract", async () => {
    seedMaintenanceContext({ contract: { contractType: "service" } });

    const plan = await buildIntervalReschedulePlan(planInput());

    expect(plan.canApply).toBe(false);
    expect(plan.applyBlockedReason).toBe("Kontrak produk bukan kontrak maintenance.");
    expect(plan.contractNumber).toBe("CTR-001");
  });

  it("blocks when the product is not registered in contract products", async () => {
    seedMaintenanceContext({ contract: { products: [ref("products", "productB")] } });

    const plan = await buildIntervalReschedulePlan(planInput());

    expect(plan.canApply).toBe(false);
    expect(plan.applyBlockedReason).toBe("Produk tidak terdaftar pada contract.products.");
  });

  it("blocks when no existing maintenance exists for the contract and product", async () => {
    seedMaintenanceContext();

    const plan = await buildIntervalReschedulePlan(planInput());

    expect(plan.canApply).toBe(false);
    expect(plan.applyBlockedReason).toBe(
      "Tidak ada maintenance existing untuk contract dan produk ini.",
    );
    expect(plan.existingMaintenances).toEqual([]);
  });

  it("selects the replaceable maintenance that contains changedAt as anchor", async () => {
    seedMaintenanceContext();
    seedMaintenance("m-current", {
      contract: ref("contracts", "contractA"),
      product: ref("products", "productA"),
      status: "pending",
      startDate: timestamp("2026-07-01"),
      endDate: timestamp("2026-07-30"),
      engineer: null,
      inspection: null,
    });
    seedMaintenance("m-future", {
      contract: ref("contracts", "contractA"),
      product: ref("products", "productA"),
      status: "scheduled",
      startDate: timestamp("2026-07-31"),
      endDate: timestamp("2026-08-29"),
      engineer: [ref("users", "engineerA")],
      inspection: null,
    });

    const plan = await buildIntervalReschedulePlan(planInput());

    expect(plan.canApply).toBe(true);
    expect(plan.anchorMaintenanceId).toBe("m-current");
    expect(plan.anchorStartDate?.toISOString().slice(0, 10)).toBe("2026-07-01");
    expect(plan.replaceableMaintenances.map((maintenance) => maintenance.id)).toEqual([
      "m-current",
      "m-future",
    ]);
    expect(plan.replaceableMaintenances[1].engineerIds).toEqual(["engineerA"]);
    expect(plan.newSchedules[0]).toMatchObject({
      sequenceNumber: 1,
      startDate: new Date("2026-07-01"),
      endDate: new Date("2026-07-14"),
    });
    expect(plan.writeSummary).toEqual({
      deleteCount: 2,
      createCount: 9,
      updateProduct: true,
      estimatedWrites: 12,
    });
  });

  it("selects the nearest future replaceable maintenance when none contains changedAt", async () => {
    seedMaintenanceContext();
    seedMaintenance("m-history", {
      contract: ref("contracts", "contractA"),
      product: ref("products", "productA"),
      status: "pending",
      startDate: timestamp("2026-06-01"),
      endDate: timestamp("2026-06-30"),
      inspection: null,
    });
    seedMaintenance("m-future", {
      contract: ref("contracts", "contractA"),
      product: ref("products", "productA"),
      status: "scheduled",
      startDate: timestamp("2026-08-01"),
      endDate: timestamp("2026-08-30"),
      inspection: null,
    });

    const plan = await buildIntervalReschedulePlan(planInput());

    expect(plan.canApply).toBe(true);
    expect(plan.anchorMaintenanceId).toBe("m-future");
    expect(plan.preservedMaintenances.map((maintenance) => maintenance.id)).toEqual([
      "m-history",
    ]);
    expect(plan.replaceableMaintenances.map((maintenance) => maintenance.id)).toEqual([
      "m-future",
    ]);
  });

  it("preserves approved and inspected maintenance and reports overlap conflicts", async () => {
    seedMaintenanceContext();
    seedMaintenance("m-anchor", {
      contract: ref("contracts", "contractA"),
      product: ref("products", "productA"),
      status: "pending",
      startDate: timestamp("2026-07-01"),
      endDate: timestamp("2026-07-30"),
      inspection: null,
    });
    seedMaintenance("m-approved", {
      contract: ref("contracts", "contractA"),
      product: ref("products", "productA"),
      status: "approved",
      startDate: timestamp("2026-08-01"),
      endDate: timestamp("2026-08-30"),
      inspection: { checklist: [] },
    });

    const plan = await buildIntervalReschedulePlan(planInput({ newInterval: 60 }));

    expect(plan.canApply).toBe(false);
    expect(plan.applyBlockedReason).toBe(
      "Jadwal baru overlap dengan maintenance yang harus dipertahankan.",
    );
    expect(plan.preservedMaintenances.map((maintenance) => maintenance.id)).toContain(
      "m-approved",
    );
    expect(plan.conflicts).toHaveLength(2);
    expect(plan.conflicts[0]).toMatchObject({
      type: "overlap",
      existingMaintenance: expect.objectContaining({ id: "m-approved" }),
    });
  });

  it("blocks plans when an existing maintenance has invalid dates", async () => {
    seedMaintenanceContext();
    seedMaintenance("m-invalid", {
      contract: ref("contracts", "contractA"),
      product: ref("products", "productA"),
      status: "pending",
      startDate: null,
      endDate: timestamp("2026-07-30"),
      inspection: null,
    });

    const plan = await buildIntervalReschedulePlan(planInput());

    expect(plan.canApply).toBe(false);
    expect(plan.applyBlockedReason).toBe("Ada maintenance existing dengan data tidak valid.");
    expect(plan.blockedMaintenances).toEqual([
      expect.objectContaining({
        maintenance: expect.objectContaining({ id: "m-invalid" }),
        reason: "invalid_date",
      }),
    ]);
  });

  it("blocks plans when product type is invalid because new maintenance would be unsafe", async () => {
    seedMaintenanceContext({ product: { productType: "UNKNOWN_TYPE" } });

    const plan = await buildIntervalReschedulePlan(planInput());

    expect(plan.canApply).toBe(false);
    expect(plan.applyBlockedReason).toBe("Produk tidak memiliki productType valid.");
  });

  it("blocks active period cut when the interval is not shortened", async () => {
    seedMaintenanceContext();
    seedMaintenance("m-active", {
      contract: ref("contracts", "contractA"),
      product: ref("products", "productA"),
      status: "scheduled",
      startDate: timestamp("2026-04-01"),
      endDate: timestamp("2026-08-31"),
      engineer: null,
      inspection: null,
    });

    const plan = await buildIntervalReschedulePlan(
      activeCutPlanInput({ oldInterval: 60, newInterval: 120 }),
    );

    expect(plan.canApply).toBe(false);
    expect(plan.applyBlockedReason).toBe(
      "Koreksi 1 periode hanya tersedia saat interval dipendekkan.",
    );
    expect(plan.activePeriodCut).toBeUndefined();
    expect(mockWriteBatch).not.toHaveBeenCalled();
  });

  it("builds an active period cut preview for one approved inspected anchor", async () => {
    seedMaintenanceContext({
      product: { maintenanceInterval: 120 },
      contract: { endDate: timestamp("2026-08-31") },
    });
    seedMaintenance("m-active", {
      contract: ref("contracts", "contractA"),
      product: ref("products", "productA"),
      status: "approved",
      startDate: timestamp("2026-04-01"),
      endDate: timestamp("2026-08-31"),
      engineer: [ref("users", "engineerA")],
      inspection: { checklist: [{ item: "Pressure", status: true }] },
    });

    const plan = await buildIntervalReschedulePlan(activeCutPlanInput());

    expect(plan.canApply).toBe(true);
    expect(plan.mode).toBe("cut_active_period_once");
    expect(plan.anchorMaintenanceId).toBe("m-active");
    expect(plan.activePeriodCut).toMatchObject({
      anchorMaintenanceId: "m-active",
      anchorStatus: "approved",
      anchorHasInspection: true,
      warningLevel: "high",
      canCut: true,
    });
    expect(plan.activePeriodCut?.previousStartDate.toISOString().slice(0, 10)).toBe(
      "2026-04-01",
    );
    expect(plan.activePeriodCut?.previousEndDate.toISOString().slice(0, 10)).toBe(
      "2026-08-31",
    );
    expect(plan.activePeriodCut?.correctedStartDate.toISOString().slice(0, 10)).toBe(
      "2026-04-01",
    );
    expect(plan.activePeriodCut?.correctedEndDate.toISOString().slice(0, 10)).toBe(
      "2026-05-30",
    );
    expect(plan.activePeriodCut?.nextScheduleStartDate?.toISOString().slice(0, 10)).toBe(
      "2026-05-31",
    );
    expect(plan.activePeriodCut?.warnings).toEqual(
      expect.arrayContaining([
        "Jadwal yang dipotong sudah memiliki inspeksi. Data inspeksi tidak akan diubah.",
        "Jadwal yang dipotong memiliki status penting. Sistem hanya mengoreksi tanggal selesai.",
        "Engineer pada jadwal yang dipotong tetap dipertahankan.",
      ]),
    );
    expect(plan.replaceableMaintenances).toEqual([]);
    expect(plan.preservedMaintenances).toEqual([]);
    expect(plan.newSchedules.map((schedule) => ({
      startDate: schedule.startDate.toISOString().slice(0, 10),
      endDate: schedule.endDate.toISOString().slice(0, 10),
    }))).toEqual([
      { startDate: "2026-05-31", endDate: "2026-07-29" },
      { startDate: "2026-07-30", endDate: "2026-08-31" },
    ]);
    expect(plan.writeSummary).toEqual({
      deleteCount: 0,
      createCount: 2,
      updateProduct: true,
      estimatedWrites: 4,
    });
    expect(mockWriteBatch).not.toHaveBeenCalled();
  });

  it("keeps the active cut anchor out of replaceable maintenances and replaces only safe future schedules", async () => {
    seedMaintenanceContext({
      contract: { endDate: timestamp("2026-10-31") },
    });
    seedMaintenance("m-active", {
      contract: ref("contracts", "contractA"),
      product: ref("products", "productA"),
      status: "scheduled",
      startDate: timestamp("2026-07-01"),
      endDate: timestamp("2026-08-29"),
      engineer: [ref("users", "engineerA")],
      inspection: null,
    });
    seedMaintenance("m-future", {
      contract: ref("contracts", "contractA"),
      product: ref("products", "productA"),
      status: "pending",
      startDate: timestamp("2026-08-30"),
      endDate: timestamp("2026-10-28"),
      engineer: null,
      inspection: null,
    });

    const plan = await buildIntervalReschedulePlan(
      activeCutPlanInput({
        oldInterval: 60,
        newInterval: 30,
        changedAt: new Date("2026-07-15"),
      }),
    );

    expect(plan.canApply).toBe(true);
    expect(plan.activePeriodCut?.anchorMaintenanceId).toBe("m-active");
    expect(plan.activePeriodCut?.correctedEndDate.toISOString().slice(0, 10)).toBe(
      "2026-07-30",
    );
    expect(plan.replaceableMaintenances.map((maintenance) => maintenance.id)).toEqual([
      "m-future",
    ]);
    expect(plan.replaceableMaintenances.map((maintenance) => maintenance.id)).not.toContain(
      "m-active",
    );
    expect(plan.activePeriodCut?.warnings).toEqual([
      "Engineer pada jadwal yang dipotong tetap dipertahankan.",
    ]);
  });

  it("blocks active period cut when more than one maintenance contains changedAt", async () => {
    seedMaintenanceContext();
    seedMaintenance("m-active-a", {
      contract: ref("contracts", "contractA"),
      product: ref("products", "productA"),
      status: "pending",
      startDate: timestamp("2026-07-01"),
      endDate: timestamp("2026-08-29"),
      inspection: null,
    });
    seedMaintenance("m-active-b", {
      contract: ref("contracts", "contractA"),
      product: ref("products", "productA"),
      status: "scheduled",
      startDate: timestamp("2026-07-10"),
      endDate: timestamp("2026-09-07"),
      inspection: null,
    });

    const plan = await buildIntervalReschedulePlan(
      activeCutPlanInput({
        oldInterval: 60,
        newInterval: 30,
        changedAt: new Date("2026-07-15"),
      }),
    );

    expect(plan.canApply).toBe(false);
    expect(plan.applyBlockedReason).toBe(
      "Ada lebih dari satu jadwal aktif pada tanggal perubahan. Periksa overlap data maintenance terlebih dahulu.",
    );
    expect(plan.activePeriodCut).toBeUndefined();
    expect(mockWriteBatch).not.toHaveBeenCalled();
  });

  it("blocks active period cut when new schedules overlap a preserved future maintenance", async () => {
    seedMaintenanceContext({
      contract: { endDate: timestamp("2026-10-31") },
    });
    seedMaintenance("m-active", {
      contract: ref("contracts", "contractA"),
      product: ref("products", "productA"),
      status: "pending",
      startDate: timestamp("2026-07-01"),
      endDate: timestamp("2026-08-29"),
      inspection: null,
    });
    seedMaintenance("m-approved", {
      contract: ref("contracts", "contractA"),
      product: ref("products", "productA"),
      status: "approved",
      startDate: timestamp("2026-08-01"),
      endDate: timestamp("2026-08-30"),
      inspection: { checklist: [] },
    });

    const plan = await buildIntervalReschedulePlan(
      activeCutPlanInput({
        oldInterval: 60,
        newInterval: 30,
        changedAt: new Date("2026-07-15"),
      }),
    );

    expect(plan.canApply).toBe(false);
    expect(plan.applyBlockedReason).toBe(
      "Jadwal baru bentrok dengan jadwal yang harus dipertahankan.",
    );
    expect(plan.preservedMaintenances.map((maintenance) => maintenance.id)).toEqual([
      "m-approved",
    ]);
    expect(plan.conflicts).toHaveLength(2);
    expect(plan.conflicts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "overlap",
          existingMaintenance: expect.objectContaining({ id: "m-approved" }),
        }),
      ]),
    );
    expect(mockWriteBatch).not.toHaveBeenCalled();
  });

  it("does not apply a plan that cannot be applied", async () => {
    seedMaintenanceContext({ product: { productType: "UNKNOWN_TYPE" } });
    const plan = await buildIntervalReschedulePlan(planInput());

    await expect(
      applyIntervalReschedulePlan({
        approvedPlan: plan,
        userRef: ref("users", "adminA") as any,
      }),
    ).rejects.toBeInstanceOf(RescheduleApplyError);

    expect(mockWriteBatch).not.toHaveBeenCalled();
    expect(mockBatch.commit).not.toHaveBeenCalled();
  });

  it("applies a valid plan with product update, replaceable deletes, new maintenance creates, and metadata", async () => {
    seedMaintenanceContext();
    seedMaintenance("m-current", {
      contract: ref("contracts", "contractA"),
      product: ref("products", "productA"),
      status: "pending",
      startDate: timestamp("2026-07-01"),
      endDate: timestamp("2026-07-30"),
      engineer: null,
      inspection: null,
    });
    seedMaintenance("m-future", {
      contract: ref("contracts", "contractA"),
      product: ref("products", "productA"),
      status: "scheduled",
      startDate: timestamp("2026-07-31"),
      endDate: timestamp("2026-08-29"),
      engineer: [ref("users", "engineerA")],
      inspection: null,
    });

    const plan = await buildIntervalReschedulePlan(planInput());
    const result = await applyIntervalReschedulePlan({
      approvedPlan: plan,
      userRef: ref("users", "adminA") as any,
    });

    expect(mockWriteBatch).toHaveBeenCalledTimes(1);
    expect(mockBatch.update).toHaveBeenCalledWith(
      { collectionName: "products", id: "productA" },
      expect.objectContaining({
        maintenanceInterval: 14,
        updatedBy: { collectionName: "users", id: "adminA" },
      }),
    );
    expect(mockBatch.delete.mock.calls.map(([docRef]) => docRef.id)).toEqual([
      "m-current",
      "m-future",
    ]);
    expect(mockBatch.set).toHaveBeenCalledTimes(plan.newSchedules.length);
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);

    const firstCreatedMaintenance = mockBatch.set.mock.calls[0][1];
    expect(firstCreatedMaintenance).toMatchObject({
      contract: { collectionName: "contracts", id: "contractA" },
      product: { collectionName: "products", id: "productA" },
      productType: "APAR",
      engineer: null,
      status: "pending",
      inspection: null,
      createdBy: { collectionName: "users", id: "adminA" },
      generationReason: "interval_change",
      generationBatchId: result.generationBatchId,
      sourceProductInterval: 14,
      previousProductInterval: 30,
      rescheduledFromProductId: "productA",
      rescheduledBy: { collectionName: "users", id: "adminA" },
    });
    expect(firstCreatedMaintenance.startDate.toDate()).toEqual(
      plan.newSchedules[0].startDate,
    );
    expect(firstCreatedMaintenance.endDate.toDate()).toEqual(
      plan.newSchedules[0].endDate,
    );
    expect(result).toMatchObject({
      deletedMaintenanceIds: ["m-current", "m-future"],
      createdCount: plan.newSchedules.length,
      updatedProductId: "productA",
      committedPlan: expect.objectContaining({
        anchorMaintenanceId: "m-current",
      }),
    });
    expect(result.createdMaintenanceIds).toHaveLength(plan.newSchedules.length);
  });

  it("applies an active period cut with anchor correction metadata and active-cut maintenance creates", async () => {
    seedMaintenanceContext({
      product: { maintenanceInterval: 60 },
      contract: { endDate: timestamp("2026-10-31") },
    });
    seedMaintenance("m-active", {
      contract: ref("contracts", "contractA"),
      product: ref("products", "productA"),
      status: "approved",
      startDate: timestamp("2026-07-01"),
      endDate: timestamp("2026-08-29"),
      engineer: [ref("users", "engineerA")],
      inspection: { checklist: [{ item: "Pressure", status: true }] },
    });
    seedMaintenance("m-future", {
      contract: ref("contracts", "contractA"),
      product: ref("products", "productA"),
      status: "pending",
      startDate: timestamp("2026-08-30"),
      endDate: timestamp("2026-10-28"),
      engineer: null,
      inspection: null,
    });

    const plan = await buildIntervalReschedulePlan(
      activeCutPlanInput({
        oldInterval: 60,
        newInterval: 30,
        changedAt: new Date("2026-07-15"),
      }),
    );
    const result = await applyIntervalReschedulePlan({
      approvedPlan: plan,
      userRef: ref("users", "adminA") as any,
    });

    expect(mockWriteBatch).toHaveBeenCalledTimes(1);
    expect(result.correctedMaintenanceId).toBe("m-active");
    expect(result.createdMaintenanceIds).toHaveLength(plan.newSchedules.length);
    expect(mockBatch.update).toHaveBeenCalledWith(
      { collectionName: "products", id: "productA" },
      expect.objectContaining({
        maintenanceInterval: 30,
        updatedBy: { collectionName: "users", id: "adminA" },
      }),
    );

    const anchorUpdateCall = mockBatch.update.mock.calls.find(
      ([docRef]) => docRef.collectionName === "maintenances" && docRef.id === "m-active",
    );
    expect(anchorUpdateCall).toBeTruthy();

    const anchorUpdateData = anchorUpdateCall?.[1];
    expect(anchorUpdateData.status).toBeUndefined();
    expect(anchorUpdateData.engineer).toBeUndefined();
    expect(anchorUpdateData.inspection).toBeUndefined();
    expect(anchorUpdateData.endDate.toDate()).toEqual(
      plan.activePeriodCut?.correctedEndDate,
    );
    expect(anchorUpdateData.periodCorrectionMeta).toMatchObject({
      reason: "interval_change_active_period_cut",
      previousProductInterval: 60,
      newProductInterval: 30,
      correctedBy: { collectionName: "users", id: "adminA" },
      generationBatchId: result.generationBatchId,
      generatedNextMaintenanceIds: result.createdMaintenanceIds,
    });
    expect(anchorUpdateData.periodCorrectionMeta.previousStartDate.toDate()).toEqual(
      plan.activePeriodCut?.previousStartDate,
    );
    expect(anchorUpdateData.periodCorrectionMeta.previousEndDate.toDate()).toEqual(
      plan.activePeriodCut?.previousEndDate,
    );
    expect(anchorUpdateData.periodCorrectionMeta.correctedStartDate.toDate()).toEqual(
      plan.activePeriodCut?.correctedStartDate,
    );
    expect(anchorUpdateData.periodCorrectionMeta.correctedEndDate.toDate()).toEqual(
      plan.activePeriodCut?.correctedEndDate,
    );
    expect(anchorUpdateData.periodCorrectionMeta.changedAt.toDate()).toEqual(
      plan.changedAt,
    );

    expect(mockBatch.delete.mock.calls.map(([docRef]) => docRef.id)).toEqual([
      "m-future",
    ]);
    expect(mockBatch.delete.mock.calls.map(([docRef]) => docRef.id)).not.toContain(
      "m-active",
    );
    expect(mockBatch.set).toHaveBeenCalledTimes(plan.newSchedules.length);

    const firstCreatedMaintenance = mockBatch.set.mock.calls[0][1];
    expect(firstCreatedMaintenance).toMatchObject({
      contract: { collectionName: "contracts", id: "contractA" },
      product: { collectionName: "products", id: "productA" },
      productType: "APAR",
      engineer: null,
      status: "pending",
      inspection: null,
      generationReason: "interval_change_active_period_cut",
      generationBatchId: result.generationBatchId,
      sourceProductInterval: 30,
      previousProductInterval: 60,
      rescheduledFromProductId: "productA",
      rescheduledBy: { collectionName: "users", id: "adminA" },
      activeCutFromMaintenanceId: "m-active",
    });
    expect(firstCreatedMaintenance.startDate.toDate()).toEqual(
      plan.newSchedules[0].startDate,
    );
    expect(firstCreatedMaintenance.endDate.toDate()).toEqual(
      plan.newSchedules[0].endDate,
    );
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  it("does not write when revalidated plan has different replaceable maintenance ids", async () => {
    seedMaintenanceContext();
    seedMaintenance("m-current", {
      contract: ref("contracts", "contractA"),
      product: ref("products", "productA"),
      status: "pending",
      startDate: timestamp("2026-07-01"),
      endDate: timestamp("2026-07-30"),
      engineer: null,
      inspection: null,
    });

    const plan = await buildIntervalReschedulePlan(planInput());

    seedMaintenance("m-added", {
      contract: ref("contracts", "contractA"),
      product: ref("products", "productA"),
      status: "scheduled",
      startDate: timestamp("2026-07-31"),
      endDate: timestamp("2026-08-29"),
      engineer: null,
      inspection: null,
    });

    await expect(
      applyIntervalReschedulePlan({
        approvedPlan: plan,
        userRef: ref("users", "adminA") as any,
      }),
    ).rejects.toBeInstanceOf(StaleReschedulePlanError);

    expect(mockWriteBatch).not.toHaveBeenCalled();
    expect(mockBatch.commit).not.toHaveBeenCalled();
  });

  it("does not write active period cut when the anchor status changes after preview", async () => {
    seedMaintenanceContext({
      product: { maintenanceInterval: 60 },
      contract: { endDate: timestamp("2026-10-31") },
    });
    seedMaintenance("m-active", {
      contract: ref("contracts", "contractA"),
      product: ref("products", "productA"),
      status: "scheduled",
      startDate: timestamp("2026-07-01"),
      endDate: timestamp("2026-08-29"),
      engineer: null,
      inspection: null,
    });

    const plan = await buildIntervalReschedulePlan(
      activeCutPlanInput({
        oldInterval: 60,
        newInterval: 30,
        changedAt: new Date("2026-07-15"),
      }),
    );
    mockMaintenances[0].data.status = "in_progress";

    await expect(
      applyIntervalReschedulePlan({
        approvedPlan: plan,
        userRef: ref("users", "adminA") as any,
      }),
    ).rejects.toMatchObject({
      name: "StaleReschedulePlanError",
      currentPlan: expect.objectContaining({
        activePeriodCut: expect.objectContaining({
          anchorStatus: "in_progress",
        }),
      }),
    });

    expect(mockWriteBatch).not.toHaveBeenCalled();
    expect(mockBatch.commit).not.toHaveBeenCalled();
  });

  it("does not write active period cut when the anchor previous end date changes after preview", async () => {
    seedMaintenanceContext({
      product: { maintenanceInterval: 60 },
      contract: { endDate: timestamp("2026-10-31") },
    });
    seedMaintenance("m-active", {
      contract: ref("contracts", "contractA"),
      product: ref("products", "productA"),
      status: "pending",
      startDate: timestamp("2026-07-01"),
      endDate: timestamp("2026-08-29"),
      engineer: null,
      inspection: null,
    });

    const plan = await buildIntervalReschedulePlan(
      activeCutPlanInput({
        oldInterval: 60,
        newInterval: 30,
        changedAt: new Date("2026-07-15"),
      }),
    );
    mockMaintenances[0].data.endDate = timestamp("2026-08-30");

    await expect(
      applyIntervalReschedulePlan({
        approvedPlan: plan,
        userRef: ref("users", "adminA") as any,
      }),
    ).rejects.toMatchObject({
      name: "StaleReschedulePlanError",
      currentPlan: expect.objectContaining({
        activePeriodCut: expect.objectContaining({
          previousEndDate: new Date("2026-08-30"),
        }),
      }),
    });

    expect(mockWriteBatch).not.toHaveBeenCalled();
    expect(mockBatch.commit).not.toHaveBeenCalled();
  });

  it("does not write active period cut when revalidation has different replaceable maintenance ids", async () => {
    seedMaintenanceContext({
      product: { maintenanceInterval: 60 },
      contract: { endDate: timestamp("2026-10-31") },
    });
    seedMaintenance("m-active", {
      contract: ref("contracts", "contractA"),
      product: ref("products", "productA"),
      status: "pending",
      startDate: timestamp("2026-07-01"),
      endDate: timestamp("2026-08-29"),
      engineer: null,
      inspection: null,
    });

    const plan = await buildIntervalReschedulePlan(
      activeCutPlanInput({
        oldInterval: 60,
        newInterval: 30,
        changedAt: new Date("2026-07-15"),
      }),
    );
    seedMaintenance("m-added", {
      contract: ref("contracts", "contractA"),
      product: ref("products", "productA"),
      status: "scheduled",
      startDate: timestamp("2026-08-30"),
      endDate: timestamp("2026-09-28"),
      engineer: null,
      inspection: null,
    });

    await expect(
      applyIntervalReschedulePlan({
        approvedPlan: plan,
        userRef: ref("users", "adminA") as any,
      }),
    ).rejects.toBeInstanceOf(StaleReschedulePlanError);

    expect(mockWriteBatch).not.toHaveBeenCalled();
    expect(mockBatch.commit).not.toHaveBeenCalled();
  });

  it("does not write active period cut when revalidation introduces a preserved overlap conflict", async () => {
    seedMaintenanceContext({
      product: { maintenanceInterval: 60 },
      contract: { endDate: timestamp("2026-10-31") },
    });
    seedMaintenance("m-active", {
      contract: ref("contracts", "contractA"),
      product: ref("products", "productA"),
      status: "pending",
      startDate: timestamp("2026-07-01"),
      endDate: timestamp("2026-08-29"),
      engineer: null,
      inspection: null,
    });

    const plan = await buildIntervalReschedulePlan(
      activeCutPlanInput({
        oldInterval: 60,
        newInterval: 30,
        changedAt: new Date("2026-07-15"),
      }),
    );
    seedMaintenance("m-approved", {
      contract: ref("contracts", "contractA"),
      product: ref("products", "productA"),
      status: "approved",
      startDate: timestamp("2026-08-01"),
      endDate: timestamp("2026-08-30"),
      inspection: { checklist: [] },
    });

    await expect(
      applyIntervalReschedulePlan({
        approvedPlan: plan,
        userRef: ref("users", "adminA") as any,
      }),
    ).rejects.toMatchObject({
      name: "StaleReschedulePlanError",
      currentPlan: expect.objectContaining({
        canApply: false,
        conflicts: expect.any(Array),
      }),
    });

    expect(mockWriteBatch).not.toHaveBeenCalled();
    expect(mockBatch.commit).not.toHaveBeenCalled();
  });

  it("does not write when revalidation introduces a preserved overlap conflict", async () => {
    seedMaintenanceContext();
    seedMaintenance("m-current", {
      contract: ref("contracts", "contractA"),
      product: ref("products", "productA"),
      status: "pending",
      startDate: timestamp("2026-07-01"),
      endDate: timestamp("2026-07-30"),
      engineer: null,
      inspection: null,
    });

    const plan = await buildIntervalReschedulePlan(planInput({ newInterval: 60 }));

    seedMaintenance("m-approved", {
      contract: ref("contracts", "contractA"),
      product: ref("products", "productA"),
      status: "approved",
      startDate: timestamp("2026-08-01"),
      endDate: timestamp("2026-08-30"),
      inspection: { checklist: [] },
    });

    await expect(
      applyIntervalReschedulePlan({
        approvedPlan: plan,
        userRef: ref("users", "adminA") as any,
      }),
    ).rejects.toMatchObject({
      name: "StaleReschedulePlanError",
      currentPlan: expect.objectContaining({
        canApply: false,
        conflicts: expect.any(Array),
      }),
    });

    expect(mockWriteBatch).not.toHaveBeenCalled();
    expect(mockBatch.commit).not.toHaveBeenCalled();
  });

  it("blocks apply before revalidation when approved plan exceeds the write guard", async () => {
    seedMaintenanceContext();
    seedMaintenance("m-current", {
      contract: ref("contracts", "contractA"),
      product: ref("products", "productA"),
      status: "pending",
      startDate: timestamp("2026-07-01"),
      endDate: timestamp("2026-07-30"),
      engineer: null,
      inspection: null,
    });

    const plan = await buildIntervalReschedulePlan(planInput());
    const oversizedPlan = {
      ...plan,
      writeSummary: {
        ...plan.writeSummary,
        estimatedWrites: 451,
      },
    };

    await expect(
      applyIntervalReschedulePlan({
        approvedPlan: oversizedPlan,
        userRef: ref("users", "adminA") as any,
      }),
    ).rejects.toMatchObject({
      name: "RescheduleApplyError",
      message: "Estimasi write melebihi batas aman 450 operasi.",
    });

    expect(mockWriteBatch).not.toHaveBeenCalled();
  });
});
