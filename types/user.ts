import { DocumentReference, Timestamp } from "firebase/firestore";

export type User = {
  createdAt: Timestamp;
  email: string;
  isActive: boolean;
  name: string;
  photoURL: string;
  role: "admin" | "user" | "engineer";
};
