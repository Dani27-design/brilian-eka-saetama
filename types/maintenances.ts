import { DocumentReference, Timestamp } from "firebase/firestore";

export type Maintenance = {
  id: string;
  contract: DocumentReference; // reference to the contract document
  product: DocumentReference; // reference to the products document
  engineer: DocumentReference[] | null; // array of references to users documents with roles "engineer"
  inspection: DocumentReference | null; // reference to the inspection document
  status: "approved" | "waiting_approval" | "scheduled" | "rejected"; // status of the maintenance schedule
  createdAt?: Timestamp;
  createdBy?: DocumentReference; // reference to the user who created the schedule
  updatedAt?: Timestamp; // optional, if the schedule is updated
  updatedBy?: DocumentReference; // optional, reference to the user who updated the schedule
};
