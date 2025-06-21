import { DocumentReference, Timestamp } from "firebase/firestore";

export type Contract = {
  id: string;
  contractNumber: string;
  customer: DocumentReference;
  startDate: Timestamp;
  endDate: Timestamp;
  status: "active" | "inactive" | "terminated";
  includesMaintenance: boolean;
  products: DocumentReference[];
  createdBy?: DocumentReference;
  updatedBy?: DocumentReference;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};
