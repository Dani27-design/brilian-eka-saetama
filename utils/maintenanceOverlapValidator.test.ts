import {
  assertNoMaintenanceOverlap,
  findOverlappingMaintenances,
  MaintenanceOverlapError,
  rangesOverlap,
} from "./maintenanceOverlapValidator";

const mockGetDocs = jest.fn();

jest.mock("@/db/firebase/firebaseConfig", () => ({
  firestore: {},
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn((_firestore, collectionName: string) => ({
    collectionName,
  })),
  query: jest.fn((collectionRef: any, ...constraints: any[]) => ({
    collectionRef,
    constraints,
  })),
  where: jest.fn((field: string, operator: string, value: any) => ({
    field,
    operator,
    value,
  })),
  getDocs: (...args: any[]) => mockGetDocs(...args),
}));

function timestamp(date: string) {
  return {
    toDate: () => new Date(date),
  };
}

function docSnapshot(id: string, data: Record<string, any>) {
  return {
    id,
    data: () => data,
  };
}

describe("maintenanceOverlapValidator", () => {
  beforeEach(() => {
    mockGetDocs.mockReset();
  });

  describe("rangesOverlap", () => {
    it("detects full overlap", () => {
      expect(
        rangesOverlap(
          new Date("2026-07-01"),
          new Date("2026-07-30"),
          new Date("2026-07-05"),
          new Date("2026-07-20"),
        ),
      ).toBe(true);
    });

    it("detects partial overlap", () => {
      expect(
        rangesOverlap(
          new Date("2026-07-01"),
          new Date("2026-07-30"),
          new Date("2026-07-30"),
          new Date("2026-08-15"),
        ),
      ).toBe(true);
    });

    it("treats same-day boundaries as overlap", () => {
      expect(
        rangesOverlap(
          new Date("2026-07-01"),
          new Date("2026-07-01"),
          new Date("2026-07-01"),
          new Date("2026-07-01"),
        ),
      ).toBe(true);
    });

    it("does not detect overlap when ranges are separated", () => {
      expect(
        rangesOverlap(
          new Date("2026-07-01"),
          new Date("2026-07-30"),
          new Date("2026-07-31"),
          new Date("2026-08-15"),
        ),
      ).toBe(false);
    });
  });

  it("finds overlapping maintenances for a contract and product pair", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        docSnapshot("overlapA", {
          startDate: timestamp("2026-07-01"),
          endDate: timestamp("2026-07-30"),
          status: "pending",
          inspection: null,
        }),
        docSnapshot("outsideA", {
          startDate: timestamp("2026-08-01"),
          endDate: timestamp("2026-08-30"),
          status: "scheduled",
          inspection: null,
        }),
      ],
    });

    const conflicts = await findOverlappingMaintenances({
      contractRef: { id: "contractA" } as any,
      productRef: { id: "productA" } as any,
      startDate: new Date("2026-07-15"),
      endDate: new Date("2026-07-20"),
    });

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({
      id: "overlapA",
      status: "pending",
      hasInspection: false,
    });
  });

  it("excludes the supplied maintenance id when checking overlap", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        docSnapshot("currentMaintenance", {
          startDate: timestamp("2026-07-01"),
          endDate: timestamp("2026-07-30"),
          status: "pending",
          inspection: null,
        }),
      ],
    });

    const conflicts = await findOverlappingMaintenances({
      contractRef: { id: "contractA" } as any,
      productRef: { id: "productA" } as any,
      startDate: new Date("2026-07-15"),
      endDate: new Date("2026-07-20"),
      excludeMaintenanceId: "currentMaintenance",
    });

    expect(conflicts).toHaveLength(0);
  });

  it("throws a structured error when overlaps are found", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        docSnapshot("overlapA", {
          startDate: timestamp("2026-07-01"),
          endDate: timestamp("2026-07-30"),
          status: "approved",
          inspection: { checklist: [] },
        }),
      ],
    });

    await expect(
      assertNoMaintenanceOverlap({
        contractRef: { id: "contractA" } as any,
        productRef: { id: "productA" } as any,
        startDate: new Date("2026-07-15"),
        endDate: new Date("2026-07-20"),
      }),
    ).rejects.toMatchObject({
      name: "MaintenanceOverlapError",
      conflicts: [
        {
          id: "overlapA",
          status: "approved",
          hasInspection: true,
        },
      ],
    });
  });

  it("does not throw when no overlaps are found", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [],
    });

    await expect(
      assertNoMaintenanceOverlap({
        contractRef: { id: "contractA" } as any,
        productRef: { id: "productA" } as any,
        startDate: new Date("2026-07-15"),
        endDate: new Date("2026-07-20"),
      }),
    ).resolves.toBeUndefined();
  });

  it("exports MaintenanceOverlapError for callers to distinguish overlap failures", () => {
    const error = new MaintenanceOverlapError([]);
    expect(error.name).toBe("MaintenanceOverlapError");
    expect(error.conflicts).toEqual([]);
  });
});
