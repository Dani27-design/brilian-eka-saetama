import { DocumentReference, Timestamp } from "firebase/firestore";

export type ProductType =
  | "APAR"
  | "HYDRANT"
  | "CCTV"
  | "FIRE_ALARM"
  | "ACCESS_DOOR"
  | "PATROL_GUARD";

export type Inspection = {
  id: string;
  contract: DocumentReference; // reference to the contract document
  product: DocumentReference; // reference to the products document
  productType: ProductType;
  maintenance: DocumentReference; // reference to the maintenance document
  photos: string[]; // array of photo URLs
  checklist: InspectionChecklist; // checklist items for APAR inspection
  createdAt?: Timestamp;
  createdBy?: DocumentReference; // reference to the user who created the inspection
  updatedAt?: Timestamp; // optional, if the inspection is updated
  updatedBy?: DocumentReference; // optional, reference to the user who updated the inspection
};

export type AparInspectionChecklistItem = {
  item: "Hose" | "Pressure" | "Handle" | "Body" | "Safety Pin" | "Exp Date";
  question: string;
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
  question: string;
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
  question: string;
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
  question: string;
  status: boolean; // true = OK, false = NOK
  remarks?: string;
};
export type FireAlarmInspectionChecklist = FireAlarmInspectionChecklistItem[];

export type AccessDoorInspectionChecklistItem = {
  item: "Material" | "Lock Type" | "Width" | "Height" | "Opening Speed";
  question: string;
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
  question: string;
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
