import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import type { DocumentReference } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import type { MaintenanceStatus } from "@/types/maintenances";
import type { ProductType } from "@/types/product";
import { calculateMaintenanceSchedules } from "./maintenanceScheduler";
import { rangesOverlap } from "./maintenanceOverlapValidator";

export type IntervalRescheduleMode =
  | "future_only"
  | "cut_active_period_once";

export type BuildIntervalReschedulePlanInput = {
  productId: string;
  oldInterval: number;
  newInterval: number;
  changedAt: Date;
  mode: IntervalRescheduleMode;
};

export type RescheduleMaintenanceSnapshot = {
  id: string;
  startDate: Date;
  endDate: Date;
  status: MaintenanceStatus;
  hasInspection: boolean;
  engineerIds: string[];
};

export type RescheduleSchedulePreview = {
  startDate: Date;
  endDate: Date;
  sequenceNumber: number;
};

export type RescheduleBlockedMaintenance = {
  maintenance: RescheduleMaintenanceSnapshot;
  reason: string;
};

export type RescheduleConflict = {
  type: "overlap";
  newSchedule: RescheduleSchedulePreview;
  existingMaintenance: RescheduleMaintenanceSnapshot;
  message: string;
};

export type ActivePeriodCutPreview = {
  anchorMaintenanceId: string;
  anchorStatus: MaintenanceStatus;
  anchorHasInspection: boolean;
  previousStartDate: Date;
  previousEndDate: Date;
  correctedStartDate: Date;
  correctedEndDate: Date;
  nextScheduleStartDate: Date | null;
  warningLevel: "normal" | "high";
  warnings: string[];
  canCut: boolean;
  blockedReason?: string;
};

export type ReschedulePlan = {
  productId: string;
  productNumber: string;
  productName: string;
  productType: ProductType | null;
  contractId: string;
  contractNumber: string;
  contractName: string;
  oldInterval: number;
  newInterval: number;
  changedAt: Date;
  anchorMaintenanceId: string | null;
  anchorStartDate: Date | null;
  contractEndDate: Date | null;
  mode: IntervalRescheduleMode;
  canApply: boolean;
  applyBlockedReason?: string;
  existingMaintenances: RescheduleMaintenanceSnapshot[];
  preservedMaintenances: RescheduleMaintenanceSnapshot[];
  replaceableMaintenances: RescheduleMaintenanceSnapshot[];
  blockedMaintenances: RescheduleBlockedMaintenance[];
  conflicts: RescheduleConflict[];
  newSchedules: RescheduleSchedulePreview[];
  activePeriodCut?: ActivePeriodCutPreview;
  writeSummary: {
    deleteCount: number;
    createCount: number;
    updateProduct: boolean;
    estimatedWrites: number;
  };
};

export type ApplyIntervalReschedulePlanInput = {
  approvedPlan: ReschedulePlan;
  userRef: DocumentReference | null;
  productUpdateData?: Record<string, any>;
};

export type ApplyIntervalReschedulePlanResult = {
  generationBatchId: string;
  deletedMaintenanceIds: string[];
  createdMaintenanceIds: string[];
  createdCount: number;
  updatedProductId: string;
  correctedMaintenanceId?: string;
  committedPlan: ReschedulePlan;
};

export class RescheduleApplyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RescheduleApplyError";
  }
}

export class StaleReschedulePlanError extends Error {
  approvedPlan: ReschedulePlan;
  currentPlan: ReschedulePlan;

  constructor(approvedPlan: ReschedulePlan, currentPlan: ReschedulePlan) {
    super("Reschedule plan is stale");
    this.name = "StaleReschedulePlanError";
    this.approvedPlan = approvedPlan;
    this.currentPlan = currentPlan;
  }
}

type MaintenanceReadResult =
  | {
      ok: true;
      snapshot: RescheduleMaintenanceSnapshot;
      contractReferenceState: "valid" | "invalid";
      productReferenceState: "valid" | "invalid";
    }
  | {
      ok: false;
      id: string;
      reason: string;
    };

type RescheduleBasePlanData = Pick<
  ReschedulePlan,
  | "productNumber"
  | "productName"
  | "productType"
  | "contractId"
  | "contractNumber"
  | "contractName"
  | "contractEndDate"
>;

const PRESERVED_STATUSES: MaintenanceStatus[] = [
  "in_progress",
  "waiting_approval",
  "approved",
  "rejected",
];

const REPLACEABLE_STATUSES: MaintenanceStatus[] = ["pending", "scheduled"];

const VALID_PRODUCT_TYPES: ProductType[] = [
  "APAR",
  "HYDRANT",
  "CCTV",
  "FIRE_ALARM",
  "ACCESS_DOOR",
  "PATROL_GUARD",
];

function toValidDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value.toDate === "function") {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getReferenceId(ref: any): string | null {
  return (
    ref &&
    typeof ref === "object" &&
    typeof ref.id === "string" &&
    ref.id.trim() !== ""
  )
    ? ref.id
    : null;
}

function getEngineerIds(engineer: any): string[] {
  if (!Array.isArray(engineer)) return [];

  return engineer
    .map((engineerRef) => getReferenceId(engineerRef))
    .filter((engineerId): engineerId is string => Boolean(engineerId));
}

function isMaintenanceStatus(value: any): value is MaintenanceStatus {
  return (
    PRESERVED_STATUSES.includes(value) || REPLACEABLE_STATUSES.includes(value)
  );
}

function isProductType(value: any): value is ProductType {
  return VALID_PRODUCT_TYPES.includes(value);
}

function isPreservedMaintenance(
  snapshot: RescheduleMaintenanceSnapshot,
): boolean {
  return snapshot.hasInspection || PRESERVED_STATUSES.includes(snapshot.status);
}

function isReplaceableMaintenance(
  snapshot: RescheduleMaintenanceSnapshot,
): boolean {
  return (
    !snapshot.hasInspection &&
    REPLACEABLE_STATUSES.includes(snapshot.status)
  );
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function isDateWithinRange(date: Date, startDate: Date, endDate: Date): boolean {
  return date >= startDate && date <= endDate;
}

function findActiveMaintenancesForCut(
  maintenances: RescheduleMaintenanceSnapshot[],
  changedAt: Date,
): RescheduleMaintenanceSnapshot[] {
  return maintenances.filter((maintenance) =>
    isDateWithinRange(changedAt, maintenance.startDate, maintenance.endDate),
  );
}

function buildActiveCutWarnings(
  anchorMaintenance: RescheduleMaintenanceSnapshot,
): string[] {
  const warnings: string[] = [];

  if (anchorMaintenance.hasInspection) {
    warnings.push(
      "Jadwal yang dipotong sudah memiliki inspeksi. Data inspeksi tidak akan diubah.",
    );
  }

  if (PRESERVED_STATUSES.includes(anchorMaintenance.status)) {
    warnings.push(
      "Jadwal yang dipotong memiliki status penting. Sistem hanya mengoreksi tanggal selesai.",
    );
  }

  if (anchorMaintenance.engineerIds.length > 0) {
    warnings.push(
      "Engineer pada jadwal yang dipotong tetap dipertahankan.",
    );
  }

  return warnings;
}

function createEmptyPlan(
  input: BuildIntervalReschedulePlanInput,
  applyBlockedReason: string,
  overrides: Partial<ReschedulePlan> = {},
): ReschedulePlan {
  return {
    productId: input.productId,
    productNumber: "",
    productName: "",
    productType: null,
    contractId: "",
    contractNumber: "",
    contractName: "",
    oldInterval: input.oldInterval,
    newInterval: input.newInterval,
    changedAt: input.changedAt,
    anchorMaintenanceId: null,
    anchorStartDate: null,
    contractEndDate: null,
    mode: input.mode,
    canApply: false,
    applyBlockedReason,
    existingMaintenances: [],
    preservedMaintenances: [],
    replaceableMaintenances: [],
    blockedMaintenances: [],
    conflicts: [],
    newSchedules: [],
    writeSummary: {
      deleteCount: 0,
      createCount: 0,
      updateProduct: false,
      estimatedWrites: 0,
    },
    ...overrides,
  };
}

function snapshotMaintenance(
  docSnap: any,
  contractRef: DocumentReference,
  productRef: DocumentReference,
): MaintenanceReadResult {
  const data = docSnap.data();
  const startDate = toValidDate(data.startDate);
  const endDate = toValidDate(data.endDate);

  if (!startDate || !endDate) {
    return {
      ok: false,
      id: docSnap.id,
      reason: "invalid_date",
    };
  }

  if (startDate > endDate) {
    return {
      ok: false,
      id: docSnap.id,
      reason: "invalid_date_range",
    };
  }

  if (!isMaintenanceStatus(data.status)) {
    return {
      ok: false,
      id: docSnap.id,
      reason: "invalid_status",
    };
  }

  return {
    ok: true,
    snapshot: {
      id: docSnap.id,
      startDate,
      endDate,
      status: data.status,
      hasInspection: Boolean(data.inspection),
      engineerIds: getEngineerIds(data.engineer),
    },
    contractReferenceState:
      getReferenceId(data.contract) === contractRef.id ? "valid" : "invalid",
    productReferenceState:
      getReferenceId(data.product) === productRef.id ? "valid" : "invalid",
  };
}

function findAnchorMaintenance(
  maintenances: RescheduleMaintenanceSnapshot[],
  changedAt: Date,
): RescheduleMaintenanceSnapshot | null {
  const replaceable = maintenances.filter(isReplaceableMaintenance);

  const containingChangedAt = replaceable.find(
    (maintenance) =>
      maintenance.startDate <= changedAt && maintenance.endDate >= changedAt,
  );

  if (containingChangedAt) return containingChangedAt;

  return (
    replaceable.find((maintenance) => maintenance.startDate > changedAt) ||
    null
  );
}

function buildOverlapConflictMessage(
  newSchedule: RescheduleSchedulePreview,
  existingMaintenance: RescheduleMaintenanceSnapshot,
): string {
  return `Jadwal baru periode ${newSchedule.sequenceNumber} overlap dengan maintenance ${existingMaintenance.id}.`;
}

function dateTime(value: Date | null | undefined): number | null {
  return value ? value.getTime() : null;
}

function equalStringArrays(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function getReplaceableMaintenanceIds(plan: ReschedulePlan): string[] {
  return plan.replaceableMaintenances.map((maintenance) => maintenance.id);
}

function schedulesMatch(
  approvedSchedules: RescheduleSchedulePreview[],
  currentSchedules: RescheduleSchedulePreview[],
): boolean {
  if (approvedSchedules.length !== currentSchedules.length) return false;

  return approvedSchedules.every((approvedSchedule, index) => {
    const currentSchedule = currentSchedules[index];
    return (
      approvedSchedule.sequenceNumber === currentSchedule.sequenceNumber &&
      approvedSchedule.startDate.getTime() === currentSchedule.startDate.getTime() &&
      approvedSchedule.endDate.getTime() === currentSchedule.endDate.getTime()
    );
  });
}

function activePeriodCutMatchesApproved(
  approvedPlan: ReschedulePlan,
  currentPlan: ReschedulePlan,
): boolean {
  const approvedActiveCut = approvedPlan.activePeriodCut;
  const currentActiveCut = currentPlan.activePeriodCut;

  if (!approvedActiveCut || !currentActiveCut) return false;

  return (
    approvedActiveCut.anchorMaintenanceId === currentActiveCut.anchorMaintenanceId &&
    approvedActiveCut.anchorStatus === currentActiveCut.anchorStatus &&
    approvedActiveCut.anchorHasInspection === currentActiveCut.anchorHasInspection &&
    approvedActiveCut.canCut === currentActiveCut.canCut &&
    dateTime(approvedActiveCut.previousStartDate) ===
      dateTime(currentActiveCut.previousStartDate) &&
    dateTime(approvedActiveCut.previousEndDate) ===
      dateTime(currentActiveCut.previousEndDate) &&
    dateTime(approvedActiveCut.correctedStartDate) ===
      dateTime(currentActiveCut.correctedStartDate) &&
    dateTime(approvedActiveCut.correctedEndDate) ===
      dateTime(currentActiveCut.correctedEndDate)
  );
}

function planStillMatchesApproved(
  approvedPlan: ReschedulePlan,
  currentPlan: ReschedulePlan,
): boolean {
  const commonPlanMatches =
    currentPlan.canApply &&
    currentPlan.conflicts.length === 0 &&
    currentPlan.blockedMaintenances.length === 0 &&
    approvedPlan.productId === currentPlan.productId &&
    approvedPlan.contractId === currentPlan.contractId &&
    approvedPlan.oldInterval === currentPlan.oldInterval &&
    approvedPlan.newInterval === currentPlan.newInterval &&
    approvedPlan.mode === currentPlan.mode &&
    approvedPlan.anchorMaintenanceId === currentPlan.anchorMaintenanceId &&
    dateTime(approvedPlan.anchorStartDate) === dateTime(currentPlan.anchorStartDate) &&
    dateTime(approvedPlan.contractEndDate) === dateTime(currentPlan.contractEndDate) &&
    equalStringArrays(
      getReplaceableMaintenanceIds(approvedPlan),
      getReplaceableMaintenanceIds(currentPlan),
    ) &&
    schedulesMatch(approvedPlan.newSchedules, currentPlan.newSchedules);

  if (!commonPlanMatches) return false;
  if (approvedPlan.mode === "future_only") return true;

  return activePeriodCutMatchesApproved(approvedPlan, currentPlan);
}

function buildFutureOnlyPlan(
  input: BuildIntervalReschedulePlanInput,
  basePlanData: RescheduleBasePlanData,
  existingMaintenances: RescheduleMaintenanceSnapshot[],
  blockedMaintenances: RescheduleBlockedMaintenance[],
): ReschedulePlan {
  const anchorMaintenance = findAnchorMaintenance(
    existingMaintenances,
    input.changedAt,
  );

  if (!anchorMaintenance) {
    return createEmptyPlan(input, "Tidak ada maintenance future yang aman diganti.", {
      ...basePlanData,
      existingMaintenances,
      preservedMaintenances: existingMaintenances,
      blockedMaintenances,
    });
  }

  const anchorStartDate = anchorMaintenance.startDate;
  const preservedMaintenances: RescheduleMaintenanceSnapshot[] = [];
  const replaceableMaintenances: RescheduleMaintenanceSnapshot[] = [];

  for (const maintenance of existingMaintenances) {
    if (maintenance.endDate < anchorStartDate) {
      preservedMaintenances.push(maintenance);
      continue;
    }

    if (isReplaceableMaintenance(maintenance)) {
      replaceableMaintenances.push(maintenance);
      continue;
    }

    if (isPreservedMaintenance(maintenance)) {
      preservedMaintenances.push(maintenance);
      continue;
    }

    blockedMaintenances.push({
      maintenance,
      reason: "not_replaceable",
    });
  }

  const newSchedules = calculateMaintenanceSchedules(
    anchorStartDate,
    basePlanData.contractEndDate as Date,
    input.newInterval,
  );

  const conflicts: RescheduleConflict[] = [];

  for (const newSchedule of newSchedules) {
    for (const preservedMaintenance of preservedMaintenances) {
      if (
        rangesOverlap(
          newSchedule.startDate,
          newSchedule.endDate,
          preservedMaintenance.startDate,
          preservedMaintenance.endDate,
        )
      ) {
        conflicts.push({
          type: "overlap",
          newSchedule,
          existingMaintenance: preservedMaintenance,
          message: buildOverlapConflictMessage(
            newSchedule,
            preservedMaintenance,
          ),
        });
      }
    }
  }

  const writeSummary = {
    deleteCount: replaceableMaintenances.length,
    createCount: newSchedules.length,
    updateProduct: true,
    estimatedWrites: replaceableMaintenances.length + newSchedules.length + 1,
  };

  let canApply = true;
  let applyBlockedReason: string | undefined;

  if (blockedMaintenances.length > 0) {
    canApply = false;
    applyBlockedReason = "Ada maintenance yang tidak dapat diklasifikasikan secara aman.";
  } else if (conflicts.length > 0) {
    canApply = false;
    applyBlockedReason = "Jadwal baru overlap dengan maintenance yang harus dipertahankan.";
  } else if (writeSummary.estimatedWrites > 450) {
    canApply = false;
    applyBlockedReason = "Estimasi write melebihi batas aman 450 operasi.";
  }

  return {
    productId: input.productId,
    productNumber: basePlanData.productNumber,
    productName: basePlanData.productName,
    productType: basePlanData.productType,
    contractId: basePlanData.contractId,
    contractNumber: basePlanData.contractNumber,
    contractName: basePlanData.contractName,
    oldInterval: input.oldInterval,
    newInterval: input.newInterval,
    changedAt: input.changedAt,
    anchorMaintenanceId: anchorMaintenance.id,
    anchorStartDate,
    contractEndDate: basePlanData.contractEndDate,
    mode: input.mode,
    canApply,
    applyBlockedReason,
    existingMaintenances,
    preservedMaintenances,
    replaceableMaintenances,
    blockedMaintenances,
    conflicts,
    newSchedules,
    writeSummary,
  };
}

function buildActivePeriodCutPlan(
  input: BuildIntervalReschedulePlanInput,
  basePlanData: RescheduleBasePlanData,
  existingMaintenances: RescheduleMaintenanceSnapshot[],
  blockedMaintenances: RescheduleBlockedMaintenance[],
): ReschedulePlan {
  if (input.newInterval >= input.oldInterval) {
    return createEmptyPlan(
      input,
      "Koreksi 1 periode hanya tersedia saat interval dipendekkan.",
      {
        ...basePlanData,
        existingMaintenances,
        preservedMaintenances: existingMaintenances,
        blockedMaintenances,
      },
    );
  }

  if (blockedMaintenances.length > 0) {
    return createEmptyPlan(input, "Ada maintenance existing dengan data tidak valid.", {
      ...basePlanData,
      existingMaintenances,
      blockedMaintenances,
    });
  }

  const activeMaintenances = findActiveMaintenancesForCut(
    existingMaintenances,
    input.changedAt,
  );

  if (activeMaintenances.length === 0) {
    return createEmptyPlan(
      input,
      "Tidak ada jadwal aktif yang mencakup tanggal perubahan interval.",
      {
        ...basePlanData,
        existingMaintenances,
        preservedMaintenances: existingMaintenances,
        blockedMaintenances,
      },
    );
  }

  if (activeMaintenances.length > 1) {
    return createEmptyPlan(
      input,
      "Ada lebih dari satu jadwal aktif pada tanggal perubahan. Periksa overlap data maintenance terlebih dahulu.",
      {
        ...basePlanData,
        existingMaintenances,
        blockedMaintenances,
      },
    );
  }

  const anchorMaintenance = activeMaintenances[0];
  const correctedEndDate = addDays(anchorMaintenance.startDate, input.newInterval - 1);
  const warnings = buildActiveCutWarnings(anchorMaintenance);
  const warningLevel =
    anchorMaintenance.hasInspection ||
    PRESERVED_STATUSES.includes(anchorMaintenance.status)
      ? "high"
      : "normal";

  const createActivePeriodCut = (
    canCut: boolean,
    blockedReason?: string,
  ): ActivePeriodCutPreview => ({
    anchorMaintenanceId: anchorMaintenance.id,
    anchorStatus: anchorMaintenance.status,
    anchorHasInspection: anchorMaintenance.hasInspection,
    previousStartDate: anchorMaintenance.startDate,
    previousEndDate: anchorMaintenance.endDate,
    correctedStartDate: anchorMaintenance.startDate,
    correctedEndDate,
    nextScheduleStartDate: null,
    warningLevel,
    warnings,
    canCut,
    blockedReason,
  });

  if (correctedEndDate < anchorMaintenance.startDate) {
    const blockedReason = "Tanggal akhir koreksi tidak valid.";
    return createEmptyPlan(input, blockedReason, {
      ...basePlanData,
      existingMaintenances,
      preservedMaintenances: existingMaintenances,
      activePeriodCut: createActivePeriodCut(false, blockedReason),
    });
  }

  if (correctedEndDate >= anchorMaintenance.endDate) {
    const blockedReason =
      "Periode aktif tidak perlu dipotong karena hasil interval baru tidak lebih pendek dari periode saat ini.";
    return createEmptyPlan(input, blockedReason, {
      ...basePlanData,
      existingMaintenances,
      preservedMaintenances: existingMaintenances,
      activePeriodCut: createActivePeriodCut(false, blockedReason),
    });
  }

  const nextScheduleStartDate = addDays(correctedEndDate, 1);
  const contractEndDate = basePlanData.contractEndDate as Date;
  const newSchedules =
    nextScheduleStartDate <= contractEndDate
      ? calculateMaintenanceSchedules(
          nextScheduleStartDate,
          contractEndDate,
          input.newInterval,
        )
      : [];

  const activePeriodCut: ActivePeriodCutPreview = {
    ...createActivePeriodCut(true),
    nextScheduleStartDate:
      nextScheduleStartDate <= contractEndDate ? nextScheduleStartDate : null,
  };

  const preservedMaintenances: RescheduleMaintenanceSnapshot[] = [];
  const replaceableMaintenances: RescheduleMaintenanceSnapshot[] = [];
  const activeBlockedMaintenances: RescheduleBlockedMaintenance[] = [];

  for (const maintenance of existingMaintenances) {
    if (maintenance.id === anchorMaintenance.id) {
      continue;
    }

    if (maintenance.endDate < anchorMaintenance.startDate) {
      preservedMaintenances.push(maintenance);
      continue;
    }

    if (maintenance.startDate <= correctedEndDate) {
      activeBlockedMaintenances.push({
        maintenance,
        reason: "overlaps_corrected_anchor",
      });
      continue;
    }

    if (isReplaceableMaintenance(maintenance)) {
      replaceableMaintenances.push(maintenance);
      continue;
    }

    if (isPreservedMaintenance(maintenance)) {
      preservedMaintenances.push(maintenance);
      continue;
    }

    activeBlockedMaintenances.push({
      maintenance,
      reason: "not_replaceable",
    });
  }

  const conflicts: RescheduleConflict[] = [];
  const correctedAnchor: RescheduleMaintenanceSnapshot = {
    ...anchorMaintenance,
    endDate: correctedEndDate,
  };

  for (const newSchedule of newSchedules) {
    if (
      rangesOverlap(
        newSchedule.startDate,
        newSchedule.endDate,
        correctedAnchor.startDate,
        correctedAnchor.endDate,
      )
    ) {
      conflicts.push({
        type: "overlap",
        newSchedule,
        existingMaintenance: correctedAnchor,
        message: buildOverlapConflictMessage(newSchedule, correctedAnchor),
      });
    }

    for (const preservedMaintenance of preservedMaintenances) {
      if (
        rangesOverlap(
          newSchedule.startDate,
          newSchedule.endDate,
          preservedMaintenance.startDate,
          preservedMaintenance.endDate,
        )
      ) {
        conflicts.push({
          type: "overlap",
          newSchedule,
          existingMaintenance: preservedMaintenance,
          message: buildOverlapConflictMessage(
            newSchedule,
            preservedMaintenance,
          ),
        });
      }
    }
  }

  const writeSummary = {
    deleteCount: replaceableMaintenances.length,
    createCount: newSchedules.length,
    updateProduct: true,
    estimatedWrites: replaceableMaintenances.length + newSchedules.length + 2,
  };

  let canApply = true;
  let applyBlockedReason: string | undefined;

  if (activeBlockedMaintenances.length > 0) {
    canApply = false;
    applyBlockedReason = "Ada maintenance existing dengan data tidak valid.";
  } else if (conflicts.length > 0) {
    canApply = false;
    applyBlockedReason = "Jadwal baru bentrok dengan jadwal yang harus dipertahankan.";
  } else if (writeSummary.estimatedWrites > 450) {
    canApply = false;
    applyBlockedReason = "Estimasi write melebihi batas aman 450 operasi.";
  }

  return {
    productId: input.productId,
    productNumber: basePlanData.productNumber,
    productName: basePlanData.productName,
    productType: basePlanData.productType,
    contractId: basePlanData.contractId,
    contractNumber: basePlanData.contractNumber,
    contractName: basePlanData.contractName,
    oldInterval: input.oldInterval,
    newInterval: input.newInterval,
    changedAt: input.changedAt,
    anchorMaintenanceId: anchorMaintenance.id,
    anchorStartDate: anchorMaintenance.startDate,
    contractEndDate: basePlanData.contractEndDate,
    mode: input.mode,
    canApply,
    applyBlockedReason,
    existingMaintenances,
    preservedMaintenances,
    replaceableMaintenances,
    blockedMaintenances: activeBlockedMaintenances,
    conflicts,
    newSchedules,
    activePeriodCut,
    writeSummary,
  };
}

export async function buildIntervalReschedulePlan(
  input: BuildIntervalReschedulePlanInput,
): Promise<ReschedulePlan> {
  if (input.mode !== "future_only" && input.mode !== "cut_active_period_once") {
    return createEmptyPlan(input, "Mode reschedule tidak didukung.");
  }

  if (
    typeof input.newInterval !== "number" ||
    Number.isNaN(input.newInterval) ||
    input.newInterval <= 0
  ) {
    return createEmptyPlan(input, "Interval maintenance baru tidak valid.");
  }

  if (!input.changedAt || Number.isNaN(input.changedAt.getTime())) {
    return createEmptyPlan(input, "Tanggal perubahan interval tidak valid.");
  }

  const productRef = doc(firestore, "products", input.productId);
  const productSnap = await getDoc(productRef);

  if (!productSnap.exists()) {
    return createEmptyPlan(input, "Produk tidak ditemukan.");
  }

  const productData = productSnap.data();
  const contractRefFromProduct = productData.contract;
  const contractId = getReferenceId(contractRefFromProduct);

  if (!contractId) {
    return createEmptyPlan(input, "Produk tidak memiliki kontrak.", {
      productNumber: String(productData.productNumber || ""),
      productName: productData.name || "",
      productType: productData.productType || null,
    });
  }

  const contractRef = doc(firestore, "contracts", contractId);
  const contractSnap = await getDoc(contractRef);

  if (!contractSnap.exists()) {
    return createEmptyPlan(input, "Kontrak produk tidak ditemukan.", {
      productNumber: String(productData.productNumber || ""),
      productName: productData.name || "",
      productType: productData.productType || null,
      contractId,
    });
  }

  const contractData = contractSnap.data();
  const contractEndDate = toValidDate(contractData.endDate);

  const productType = isProductType(productData.productType)
    ? productData.productType
    : null;

  const basePlanData = {
    productNumber: String(productData.productNumber || ""),
    productName: productData.name || "",
    productType,
    contractId,
    contractNumber: contractData.contractNumber || "",
    contractName: contractData.contractName || "",
    contractEndDate,
  };

  if (!productType) {
    return createEmptyPlan(
      input,
      "Produk tidak memiliki productType valid.",
      basePlanData,
    );
  }

  if (contractData.contractType !== "maintenance") {
    return createEmptyPlan(
      input,
      "Kontrak produk bukan kontrak maintenance.",
      basePlanData,
    );
  }

  if (!contractEndDate) {
    return createEmptyPlan(
      input,
      "Kontrak maintenance tidak memiliki tanggal selesai valid.",
      basePlanData,
    );
  }

  const contractProductIds = Array.isArray(contractData.products)
    ? contractData.products
        .map((contractProductRef: any) => getReferenceId(contractProductRef))
        .filter(Boolean)
    : [];

  if (!contractProductIds.includes(input.productId)) {
    return createEmptyPlan(input, "Produk tidak terdaftar pada contract.products.", basePlanData);
  }

  const maintenancesQuery = query(
    collection(firestore, "maintenances"),
    where("contract", "==", contractRef),
    where("product", "==", productRef),
  );
  const maintenanceSnapshot = await getDocs(maintenancesQuery);

  const readResults = maintenanceSnapshot.docs.map((maintenanceDoc) =>
    snapshotMaintenance(maintenanceDoc, contractRef, productRef),
  );

  const existingMaintenances = readResults
    .filter(
      (result): result is Extract<MaintenanceReadResult, { ok: true }> =>
        result.ok,
    )
    .map((result) => result.snapshot)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  const invalidReadResults = readResults.filter(
    (result): result is Extract<MaintenanceReadResult, { ok: false }> =>
      !result.ok,
  );

  const blockedMaintenances: RescheduleBlockedMaintenance[] =
    invalidReadResults.map((result) => ({
      maintenance: {
        id: result.id,
        startDate: new Date(0),
        endDate: new Date(0),
        status: "pending",
        hasInspection: false,
        engineerIds: [],
      },
      reason: result.reason,
    }));

  for (const result of readResults) {
    if (!result.ok) continue;
    if (
      result.contractReferenceState !== "valid" ||
      result.productReferenceState !== "valid"
    ) {
      blockedMaintenances.push({
        maintenance: result.snapshot,
        reason: "invalid_reference",
      });
    }
  }

  if (existingMaintenances.length === 0 && blockedMaintenances.length > 0) {
    return createEmptyPlan(input, "Ada maintenance existing dengan data tidak valid.", {
      ...basePlanData,
      blockedMaintenances,
    });
  }

  if (existingMaintenances.length === 0) {
    return createEmptyPlan(
      input,
      "Tidak ada maintenance existing untuk contract dan produk ini.",
      {
        ...basePlanData,
        blockedMaintenances,
      },
    );
  }

  if (input.mode === "future_only") {
    return buildFutureOnlyPlan(
      input,
      basePlanData,
      existingMaintenances,
      blockedMaintenances,
    );
  }

  return buildActivePeriodCutPlan(
    input,
    basePlanData,
    existingMaintenances,
    blockedMaintenances,
  );
}

export async function applyIntervalReschedulePlan({
  approvedPlan,
  userRef,
  productUpdateData,
}: ApplyIntervalReschedulePlanInput): Promise<ApplyIntervalReschedulePlanResult> {
  if (!approvedPlan.canApply) {
    throw new RescheduleApplyError(
      approvedPlan.applyBlockedReason || "Plan reschedule tidak dapat di-apply.",
    );
  }

  if (approvedPlan.writeSummary.estimatedWrites > 450) {
    throw new RescheduleApplyError(
      "Estimasi write melebihi batas aman 450 operasi.",
    );
  }

  const currentPlan = await buildIntervalReschedulePlan({
    productId: approvedPlan.productId,
    oldInterval: approvedPlan.oldInterval,
    newInterval: approvedPlan.newInterval,
    changedAt: approvedPlan.changedAt,
    mode: approvedPlan.mode,
  });

  if (!planStillMatchesApproved(approvedPlan, currentPlan)) {
    throw new StaleReschedulePlanError(approvedPlan, currentPlan);
  }

  if (!currentPlan.productType) {
    throw new RescheduleApplyError("Produk tidak memiliki productType valid.");
  }

  if (!currentPlan.contractId) {
    throw new RescheduleApplyError("Kontrak produk tidak valid.");
  }

  if (currentPlan.writeSummary.estimatedWrites > 450) {
    throw new RescheduleApplyError(
      "Estimasi write melebihi batas aman 450 operasi.",
    );
  }

  const productRef = doc(firestore, "products", currentPlan.productId);
  const contractRef = doc(firestore, "contracts", currentPlan.contractId);
  const generationBatchId = doc(
    collection(firestore, "maintenanceRescheduleBatches"),
  ).id;
  const batch = writeBatch(firestore);
  const createdMaintenanceRefs = currentPlan.newSchedules.map(() =>
    doc(collection(firestore, "maintenances")),
  );
  const createdMaintenanceIds = createdMaintenanceRefs.map(
    (maintenanceRef) => maintenanceRef.id,
  );

  batch.update(productRef, {
    ...(productUpdateData || {}),
    maintenanceInterval: currentPlan.newInterval,
    updatedAt: serverTimestamp(),
    updatedBy: userRef,
  });

  let correctedMaintenanceId: string | undefined;

  if (currentPlan.mode === "cut_active_period_once") {
    const activePeriodCut = currentPlan.activePeriodCut;

    if (!activePeriodCut?.canCut) {
      throw new RescheduleApplyError(
        activePeriodCut?.blockedReason ||
          "Plan koreksi 1 periode aktif tidak dapat di-apply.",
      );
    }

    correctedMaintenanceId = activePeriodCut.anchorMaintenanceId;

    batch.update(doc(firestore, "maintenances", activePeriodCut.anchorMaintenanceId), {
      endDate: Timestamp.fromDate(activePeriodCut.correctedEndDate),
      updatedAt: serverTimestamp(),
      updatedBy: userRef,
      periodCorrectionMeta: {
        reason: "interval_change_active_period_cut",
        previousStartDate: Timestamp.fromDate(activePeriodCut.previousStartDate),
        previousEndDate: Timestamp.fromDate(activePeriodCut.previousEndDate),
        correctedStartDate: Timestamp.fromDate(activePeriodCut.correctedStartDate),
        correctedEndDate: Timestamp.fromDate(activePeriodCut.correctedEndDate),
        previousProductInterval: currentPlan.oldInterval,
        newProductInterval: currentPlan.newInterval,
        changedAt: Timestamp.fromDate(currentPlan.changedAt),
        correctedAt: serverTimestamp(),
        correctedBy: userRef,
        generationBatchId,
        generatedNextMaintenanceIds: createdMaintenanceIds,
      },
    });
  }

  const deletedMaintenanceIds = currentPlan.replaceableMaintenances.map(
    (maintenance) => maintenance.id,
  );

  for (const maintenanceId of deletedMaintenanceIds) {
    batch.delete(doc(firestore, "maintenances", maintenanceId));
  }

  for (let index = 0; index < currentPlan.newSchedules.length; index++) {
    const schedule = currentPlan.newSchedules[index];
    const isActivePeriodCut = currentPlan.mode === "cut_active_period_once";
    const maintenanceRef = createdMaintenanceRefs[index];

    batch.set(maintenanceRef, {
      contract: contractRef,
      product: productRef,
      productType: currentPlan.productType,
      engineer: null,
      status: "pending",
      startDate: Timestamp.fromDate(schedule.startDate),
      endDate: Timestamp.fromDate(schedule.endDate),
      inspection: null,
      createdAt: serverTimestamp(),
      createdBy: userRef,
      generationReason: isActivePeriodCut
        ? "interval_change_active_period_cut"
        : "interval_change",
      generationBatchId,
      sourceProductInterval: currentPlan.newInterval,
      previousProductInterval: currentPlan.oldInterval,
      rescheduledFromProductId: currentPlan.productId,
      rescheduledAt: serverTimestamp(),
      rescheduledBy: userRef,
      ...(isActivePeriodCut
        ? { activeCutFromMaintenanceId: correctedMaintenanceId }
        : {}),
    });
  }

  await batch.commit();

  return {
    generationBatchId,
    deletedMaintenanceIds,
    createdMaintenanceIds,
    createdCount: createdMaintenanceIds.length,
    updatedProductId: currentPlan.productId,
    correctedMaintenanceId,
    committedPlan: currentPlan,
  };
}
