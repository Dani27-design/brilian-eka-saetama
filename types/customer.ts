import { DocumentReference, Timestamp } from "firebase/firestore";

export type Customer = {
  name: string;
  address: string;
  contact: {
    phone: number;
    email: string;
    name: string;
  };
  createdAt?: Timestamp;
  createdBy?: DocumentReference;
  updatedAt?: Timestamp;
  updatedBy?: DocumentReference;
};
