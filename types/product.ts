import { DocumentReference, Timestamp } from "firebase/firestore";

export type ProductType =
  | "APAR"
  | "HYDRANT"
  | "CCTV"
  | "FIRE_ALARM"
  | "ACCESS_DOOR"
  | "PATROL_GUARD";

export type BaseSpecs = {
  brand?: string;
  brandType?: string;
  manufactureDate?: Timestamp | null;
  installationDate?: Timestamp | null;
  expirationDate?: Timestamp | null;
  serialNumber?: string | null;
};

export type ProductSpecs =
  | ({
      // APAR
      height?: number | null;
      width?: number | null;
      pressure?: number | null;
      capacity?: number | null;
      agentType?: string | null;
      weight?: number | null; // berat total
    } & BaseSpecs)
  | ({
      // HYDRANT
      height?: number | null;
      width?: number | null;
      flowRate?: number | null;
      pressure?: number | null;
      valveType?: string | null;
      hoseLength?: number | null; // panjang selang
      material?: string | null; // material body
    } & BaseSpecs)
  | ({
      // CCTV
      resolution?: string | null;
      lens?: string | null;
      nightVision?: boolean | null;
      power?: string | null;
      connectivity?: string | null;
      pan?: boolean | null;
      tilt?: boolean | null;
      storageCapacity?: string | null; // kapasitas penyimpanan
    } & BaseSpecs)
  | ({
      // FIRE_ALARM
      sensorType?: string | null;
      power?: string | null;
      coverageArea?: number | null;
      soundLevel?: number | null;
      batteryBackup?: boolean | null; // cadangan baterai
      connectivity?: string | null;
    } & BaseSpecs)
  | ({
      // ACCESS_DOOR
      material?: string | null;
      lockType?: string | null;
      width?: number | null;
      height?: number | null;
      openingSpeed?: number | null; // kecepatan buka (cm/s)
    } & BaseSpecs)
  | ({
      // PATROL_GUARD
      deviceType?: string | null;
      batteryLife?: string | null;
      connectivity?: string | null;
      patrolInterval?: number | null; // interval patroli (menit)
      firmwareVersion?: string | null;
    } & BaseSpecs);

export type Product = {
  id?: string;
  name: string;
  productNumber: number;
  productType: ProductType;
  specs: ProductSpecs;
  source: string; // e.g., "VENDOR ABC", "INTERNAL"
  maintenanceInterval: number; // in days
  imageUrl: string;
  contract: DocumentReference | null; // reference to the contract this product belongs to
  createdAt?: Timestamp;
  createdBy?: DocumentReference | null; // reference to the user who created the product
  updatedAt?: Timestamp;
  updatedBy?: DocumentReference | null; // reference to the user who updated the product
};
