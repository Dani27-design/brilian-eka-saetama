import { DocumentReference, Timestamp } from "firebase/firestore";

export type CustomerType = "individual" | "corporate" | "government" | "nonprofit";

export type ContactPerson = {
  id: string;
  name: string;
  email: string;
  phone: string;
  position?: string;
  department?: string;
  isPrimary: boolean;
  isActive: boolean;
};

export type CustomerAddress = {
  street: string;
  village: string;    // Kelurahan/Desa
  district: string;   // Kecamatan
  city: string;       // Kota/Kabupaten
  province: string;   // Provinsi
  postalCode?: string;
  coordinates?: { lat: number; lng: number };
};

export type Customer = {
  // Basic Information
  name: string;
  customerType: CustomerType;
  businessField?: string; // Industry/business sector
  
  // Advanced Address
  address: CustomerAddress;
  
  // Multi-contact support
  contacts: ContactPerson[];
  primaryContactId?: string;
  
  // Legacy support - will be migrated
  contact?: {
    phone: number | string;
    email: string;
    name: string;
  };
  
  // Audit fields
  createdAt?: Timestamp;
  createdBy?: DocumentReference;
  updatedAt?: Timestamp;
  updatedBy?: DocumentReference;
};
