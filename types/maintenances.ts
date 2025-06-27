import { DocumentReference, Timestamp } from "firebase/firestore";
import { ProductType } from "./product";

export type MaintenanceStatus =
  | "scheduled"
  | "pending"
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

export type HydrantInspectionChecklistItem = {
  item:
    | "Height"
    | "Width"
    | "Flow Rate"
    | "Pressure"
    | "Valve Type"
    | "Hose Length"
    | "Material";
  status: boolean; // true = OK, false = NOK
  remarks?: string;
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
  item:
    | "Sensor Type"
    | "Power"
    | "Coverage Area"
    | "Sound Level"
    | "Battery Backup"
    | "Connectivity";
  status: boolean; // true = OK, false = NOK
  remarks?: string;
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
  | CctvInspectionChecklist
  | FireAlarmInspectionChecklist
  | AccessDoorInspectionChecklist
  | PatrolGuardInspectionChecklist;
