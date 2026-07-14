import {
  collection,
  DocumentReference,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { MaintenanceStatus } from "@/types/maintenances";

export type MaintenanceOverlapConflict = {
  id: string;
  startDate: Date;
  endDate: Date;
  status?: MaintenanceStatus;
  hasInspection: boolean;
};

export type FindOverlappingMaintenancesInput = {
  contractRef: DocumentReference;
  productRef: DocumentReference;
  startDate: Date;
  endDate: Date;
  excludeMaintenanceId?: string;
};

export class MaintenanceOverlapError extends Error {
  conflicts: MaintenanceOverlapConflict[];

  constructor(conflicts: MaintenanceOverlapConflict[]) {
    super("Maintenance overlap detected");
    this.name = "MaintenanceOverlapError";
    this.conflicts = conflicts;
  }
}

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

export function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart <= bEnd && aEnd >= bStart;
}

export async function findOverlappingMaintenances({
  contractRef,
  productRef,
  startDate,
  endDate,
  excludeMaintenanceId,
}: FindOverlappingMaintenancesInput): Promise<MaintenanceOverlapConflict[]> {
  const maintenancesQuery = query(
    collection(firestore, "maintenances"),
    where("contract", "==", contractRef),
    where("product", "==", productRef),
  );

  const snapshot = await getDocs(maintenancesQuery);
  const conflicts: MaintenanceOverlapConflict[] = [];

  snapshot.docs.forEach((docSnap) => {
    if (excludeMaintenanceId && docSnap.id === excludeMaintenanceId) {
      return;
    }

    const data = docSnap.data();
    const existingStartDate = toValidDate(data.startDate);
    const existingEndDate = toValidDate(data.endDate);

    if (!existingStartDate || !existingEndDate) {
      return;
    }

    if (rangesOverlap(startDate, endDate, existingStartDate, existingEndDate)) {
      conflicts.push({
        id: docSnap.id,
        startDate: existingStartDate,
        endDate: existingEndDate,
        status: data.status,
        hasInspection: Boolean(data.inspection),
      });
    }
  });

  return conflicts;
}

export async function assertNoMaintenanceOverlap(
  input: FindOverlappingMaintenancesInput,
): Promise<void> {
  const conflicts = await findOverlappingMaintenances(input);

  if (conflicts.length > 0) {
    throw new MaintenanceOverlapError(conflicts);
  }
}
