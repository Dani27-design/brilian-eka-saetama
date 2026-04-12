import { DocumentReference, Timestamp } from "firebase/firestore";
import { ProductType } from "./product";

export type MaintenanceStatus =
  | "scheduled"
  | "pending"
  | "in_progress"
  | "waiting_approval"
  | "approved"
  | "rejected";

export type Maintenance = {
  id?: string;
  contract: DocumentReference;
  product: DocumentReference;
  productType: ProductType; // product type based on product document collection field productType value
  engineer: DocumentReference[] | null;

  status: MaintenanceStatus; // default value on first create is "pending", if engineer field filled its change to "scheduled"

  startDate: Timestamp;
  endDate: Timestamp;

  // Optional inspection field, filled by user engineer role, but can edited by admin, for first create it must be null
  inspection?: {
    checklist: InspectionChecklist;
    photos: string[];
    createdAt: Timestamp;
    createdBy: DocumentReference;
    updatedAt?: Timestamp;
    updatedBy?: DocumentReference;
  } | null;

  createdAt?: Timestamp;
  createdBy?: DocumentReference;
  updatedAt?: Timestamp;
  updatedBy?: DocumentReference;
};

export type AparInspectionChecklistItem = {
  item: "Hose" | "Pressure" | "Handle" | "Body" | "Safety Pin" | "Exp Date";
  status: boolean; // true = OK, false = NOK
  remarks?: string;
};

export type AparInspectionChecklist = AparInspectionChecklistItem[];

export type HydrantHPEInspectionChecklistItem = {
  item: string;
  detail: string; // Full Indonesian activity description
  status: boolean; // true = Sudah dilakukan, false = Belum dilakukan
  remarks?: string;
  photos?: string[]; // Per-item photos from Firebase Storage
};
export type HydrantHPEInspectionChecklist = HydrantHPEInspectionChecklistItem[];

export type HydrantHPOInspectionChecklistItem = {
  item: string;
  detail: string;
  status: boolean;
  remarks?: string;
  photos?: string[];
};
export type HydrantHPOInspectionChecklist = HydrantHPOInspectionChecklistItem[];

// Legacy type kept for backward compatibility with old data
export type HydrantInspectionChecklistItem = {
  item: string;
  detail?: string;
  status: boolean;
  remarks?: string;
  photos?: string[];
};
export type HydrantInspectionChecklist = HydrantInspectionChecklistItem[];

export type CctvInspectionChecklistItem = {
  item:
    | "Resolution"
    | "Lens"
    | "Night Vision"
    | "Power"
    | "Connectivity"
    | "Pan"
    | "Tilt"
    | "Storage Capacity";
  status: boolean; // true = OK, false = NOK
  remarks?: string;
};
export type CctvInspectionChecklist = CctvInspectionChecklistItem[];

export type FireAlarmInspectionChecklistItem = {
  item: string;
  detail?: string; // Full Indonesian activity description
  status: boolean; // true = Sudah dilakukan, false = Belum dilakukan
  remarks?: string;
  photos?: string[]; // Per-item photos from Firebase Storage
};
export type FireAlarmInspectionChecklist = FireAlarmInspectionChecklistItem[];

export type AccessDoorInspectionChecklistItem = {
  item: "Material" | "Lock Type" | "Width" | "Height" | "Opening Speed";
  status: boolean; // true = OK, false = NOK
  remarks?: string;
};
export type AccessDoorInspectionChecklist = AccessDoorInspectionChecklistItem[];

export type PatrolGuardInspectionChecklistItem = {
  item:
    | "Device Type"
    | "Battery Life"
    | "Connectivity"
    | "Patrol Interval"
    | "Firmware Version";
  status: boolean; // true = OK, false = NOK
  remarks?: string;
};
export type PatrolGuardInspectionChecklist =
  PatrolGuardInspectionChecklistItem[];

export type InspectionChecklist =
  | AparInspectionChecklist
  | HydrantInspectionChecklist
  | HydrantHPEInspectionChecklist
  | HydrantHPOInspectionChecklist
  | CctvInspectionChecklist
  | FireAlarmInspectionChecklist
  | AccessDoorInspectionChecklist
  | PatrolGuardInspectionChecklist;
