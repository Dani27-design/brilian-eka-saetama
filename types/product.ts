export type ProductType =
  | "APAR"
  | "HYDRANT"
  | "CCTV"
  | "FIRE_ALARM"
  | "ACCESS_DOOR"
  | "PATROL_GUARD";

export type ProductSpecs =
  | {
      // APAR
      weight: number;
      height: number;
      width: number;
      pressure: number;
      capacity: number;
      agentType: string;
    }
  | {
      // HYDRANT
      weight: number;
      height: number;
      width: number;
      flowRate: number;
      pressure: number;
      valveType: string;
    }
  | {
      // CCTV
      resolution: string;
      lens: string;
      nightVision: boolean;
      power: string;
      connectivity: string;
    }
  | {
      // FIRE_ALARM
      sensorType: string;
      power: string;
      coverageArea: number;
      soundLevel: number;
    }
  | {
      // ACCESS_DOOR
      material: string;
      lockType: string;
      width: number;
      height: number;
    }
  | {
      // PATROL_GUARD
      deviceType: string;
      batteryLife: string;
      connectivity: string;
    };

export type Product = {
  id: string;
  name: string;
  productNumber: string;
  brand: string;
  brandType: string;
  productType: ProductType;
  specs: ProductSpecs;
  source: string; // e.g., "VENDOR ABC", "INTERNAL"
  maintenanceInterval: number; // in days
  imageUrl?: string;
  createdAt?: any;
  createdBy?: any;
  updatedAt?: any;
  updatedBy?: any;
};
