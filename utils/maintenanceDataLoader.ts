import {
  collection,
  getDocs,
  getDoc,
  doc,
  DocumentReference,
  DocumentSnapshot,
  DocumentData,
  query,
  where
} from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { Maintenance, MaintenanceStatus } from "@/types/maintenances";
import { ProductType } from "@/types/product";

/**
 * Enhanced maintenance table row with all related data
 */
export type MaintenanceTableRow = {
  id: string;
  contractNumber: string;
  contractName: string;
  productNumber: string;
  productName: string;
  productType: ProductType;
  startDate: Date | null;
  endDate: Date | null;
  status: MaintenanceStatus;
  engineers: Array<{ id: string; name: string }>;
  hasInspection: boolean;
  inspection: any;
  // Additional contract data
  contractData?: {
    id: string;
    contractName: string;
    contractNumber: string;
    customerData?: {
      id: string;
      name: string;
    };
  };
  // Additional product data
  productData?: {
    id: string;
    name: string;
    productNumber: string;
    productType: ProductType;
    specs?: any;
  };
  referenceStatus?: {
    contract: "valid" | "missing" | "not_found";
    product: "valid" | "missing" | "not_found";
  };
  isRepairable?: boolean;
  repairReasons?: string[];
};

function getReferenceId(ref: any): string | null {
  return ref && typeof ref === "object" && typeof ref.id === "string" && ref.id.trim() !== ""
    ? ref.id
    : null;
}

function toDateOrNull(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Batch loads contracts by their IDs
 */
async function batchGetContracts(contractIds: string[]): Promise<Map<string, any>> {
  const contractsMap = new Map<string, any>();
  
  if (contractIds.length === 0) return contractsMap;

  try {
    // Use Promise.all to fetch contracts in parallel
    const contractPromises = contractIds.map(id => getDoc(doc(firestore, "contracts", id)));
    const contractSnapshots = await Promise.all(contractPromises);

    contractSnapshots.forEach((snap, index) => {
      if (snap.exists()) {
        contractsMap.set(contractIds[index], {
          id: snap.id,
          ...snap.data()
        });
      }
    });
  } catch (error) {
    console.error("Error batch loading contracts:", error);
  }

  return contractsMap;
}

/**
 * Batch loads products by their IDs
 */
async function batchGetProducts(productIds: string[]): Promise<Map<string, any>> {
  const productsMap = new Map<string, any>();
  
  if (productIds.length === 0) return productsMap;

  try {
    // Use Promise.all to fetch products in parallel
    const productPromises = productIds.map(id => getDoc(doc(firestore, "products", id)));
    const productSnapshots = await Promise.all(productPromises);

    productSnapshots.forEach((snap, index) => {
      if (snap.exists()) {
        productsMap.set(productIds[index], {
          id: snap.id,
          ...snap.data()
        });
      }
    });
  } catch (error) {
    console.error("Error batch loading products:", error);
  }

  return productsMap;
}

/**
 * Batch loads engineers by their IDs
 */
async function batchGetEngineers(engineerIds: string[]): Promise<Map<string, any>> {
  const engineersMap = new Map<string, any>();
  
  if (engineerIds.length === 0) return engineersMap;

  try {
    // Use Promise.all to fetch engineers in parallel
    const engineerPromises = engineerIds.map(id => getDoc(doc(firestore, "users", id)));
    const engineerSnapshots = await Promise.all(engineerPromises);

    engineerSnapshots.forEach((snap, index) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.role === "engineer") {
          engineersMap.set(engineerIds[index], {
            id: snap.id,
            name: data.name || snap.id,
            ...data
          });
        }
      }
    });
  } catch (error) {
    console.error("Error batch loading engineers:", error);
  }

  return engineersMap;
}

/**
 * Batch loads customers by their IDs
 */
async function batchGetCustomers(customerIds: string[]): Promise<Map<string, any>> {
  const customersMap = new Map<string, any>();
  
  if (customerIds.length === 0) return customersMap;

  try {
    // Use Promise.all to fetch customers in parallel
    const customerPromises = customerIds.map(id => getDoc(doc(firestore, "customers", id)));
    const customerSnapshots = await Promise.all(customerPromises);

    customerSnapshots.forEach((snap, index) => {
      if (snap.exists()) {
        customersMap.set(customerIds[index], {
          id: snap.id,
          ...snap.data()
        });
      }
    });
  } catch (error) {
    console.error("Error batch loading customers:", error);
  }

  return customersMap;
}

/**
 * Efficiently loads maintenances with all related data using batch processing
 * This replaces the N+1 query anti-pattern with optimized parallel loading
 */
export async function loadMaintenancesWithRelatedData(
  maintenances: Maintenance[]
): Promise<MaintenanceTableRow[]> {
  if (maintenances.length === 0) {
    return [];
  }

  try {
    // Extract all unique IDs for batch loading
    const contractIds = Array.from(new Set(
      maintenances
        .map(m => getReferenceId(m.contract))
        .filter((id): id is string => Boolean(id))
    ));
    const productIds = Array.from(new Set(
      maintenances
        .map(m => getReferenceId(m.product))
        .filter((id): id is string => Boolean(id))
    ));
    const engineerIds = Array.from(new Set(
      maintenances.flatMap(m => 
        Array.isArray(m.engineer)
          ? m.engineer.map(e => getReferenceId(e)).filter((id): id is string => Boolean(id))
          : []
      )
    ));

    // Batch load all related data in parallel
    const [contractsMap, productsMap, engineersMap] = await Promise.all([
      batchGetContracts(contractIds),
      batchGetProducts(productIds),
      batchGetEngineers(engineerIds)
    ]);

    // Extract customer IDs from loaded contracts
    const customerIds = Array.from(new Set(
      Array.from(contractsMap.values())
        .map(contract => contract.customer?.id)
        .filter(Boolean)
    ));

    // Load customers if any exist
    const customersMap = await batchGetCustomers(customerIds);

    // Transform maintenances into table rows
    const tableRows: MaintenanceTableRow[] = await Promise.all(
      maintenances.map(async (maintenance, index) => {
        const maintenanceId = maintenance.id || `temp-${index}`;
        const contractId = getReferenceId(maintenance.contract);
        const productId = getReferenceId(maintenance.product);
        
        // Get contract data
        const contractData = contractId ? contractsMap.get(contractId) : null;
        const contractStatus = !contractId ? "missing" : contractData ? "valid" : "not_found";
        const contractNumber = contractData?.contractNumber || "-";
        const contractName = contractData?.contractName || "Kontrak tidak valid";
        
        // Get customer data
        let customerData: any = null;
        if (contractData?.customer?.id) {
          customerData = customersMap.get(contractData.customer.id);
        }

        // Get product data
        const productData = productId ? productsMap.get(productId) : null;
        const productStatus = !productId ? "missing" : productData ? "valid" : "not_found";
        const productNumber = productData?.productNumber || "-";
        const productName = productData?.name || "Produk tidak valid";
        const productType = maintenance.productType || productData?.productType || "APAR";
        const repairReasons: string[] = [];

        if (contractStatus === "missing") {
          repairReasons.push("missing_contract_reference");
        } else if (contractStatus === "not_found") {
          repairReasons.push("contract_reference_not_found");
        }

        if (productStatus === "missing") {
          repairReasons.push("missing_product_reference");
        } else if (productStatus === "not_found") {
          repairReasons.push("product_reference_not_found");
        }

        // Get engineers data
        const engineers: Array<{ id: string; name: string }> = [];
        if (Array.isArray(maintenance.engineer)) {
          for (const engRef of maintenance.engineer) {
            const engineerId = getReferenceId(engRef);
            if (!engineerId) continue;
            const engineerData = engineersMap.get(engineerId);
            if (engineerData) {
              engineers.push({
                id: engineerId,
                name: engineerData.name || engineerId
              });
            }
          }
        }

        return {
          id: maintenanceId,
          contractNumber,
          contractName,
          productNumber,
          productName,
          productType,
          startDate: toDateOrNull(maintenance.startDate),
          endDate: toDateOrNull(maintenance.endDate),
          status: maintenance.status,
          engineers,
          hasInspection: !!maintenance.inspection,
          inspection: maintenance.inspection,
          contractData: contractData ? {
            id: contractData.id,
            contractName: contractData.contractName,
            contractNumber: contractData.contractNumber,
            customerData: customerData ? {
              id: customerData.id,
              name: customerData.name
            } : undefined
          } : undefined,
          productData: productData ? {
            id: productData.id,
            name: productData.name,
            productNumber: productData.productNumber,
            productType: productData.productType,
            specs: productData.specs
          } : undefined,
          referenceStatus: {
            contract: contractStatus,
            product: productStatus
          },
          isRepairable: productStatus !== "valid" && contractStatus === "valid",
          repairReasons
        };
      })
    );

    return tableRows;

  } catch (error) {
    console.error("Error loading maintenances with related data:", error);
    throw error;
  }
}

/**
 * Loads all available engineers for filter options
 */
export async function loadAvailableEngineers(): Promise<Array<{ id: string; name: string }>> {
  try {
    const usersSnapshot = await getDocs(
      query(collection(firestore, "users"), where("role", "==", "engineer"))
    );
    
    const engineers: Array<{ id: string; name: string }> = [];
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      engineers.push({
        id: doc.id,
        name: data.name || doc.id
      });
    });

    return engineers.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error loading available engineers:", error);
    return [];
  }
}

/**
 * Loads unique contract numbers for filter options
 */
export async function loadAvailableContracts(): Promise<Array<{ id: string; contractNumber: string }>> {
  try {
    const contractsSnapshot = await getDocs(collection(firestore, "contracts"));
    
    const contracts: Array<{ id: string; contractNumber: string }> = [];
    contractsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.contractNumber) {
        contracts.push({
          id: doc.id,
          contractNumber: data.contractNumber
        });
      }
    });

    return contracts.sort((a, b) => a.contractNumber.localeCompare(b.contractNumber));
  } catch (error) {
    console.error("Error loading available contracts:", error);
    return [];
  }
}

/**
 * Performance monitoring for data loading operations
 */
export function createPerformanceMonitor() {
  const startTime = performance.now();
  
  return {
    end: (operation: string, recordCount: number) => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`[Performance] ${operation}: ${duration.toFixed(2)}ms for ${recordCount} records`);
      
      return {
        operation,
        duration,
        recordCount,
        avgTimePerRecord: duration / recordCount
      };
    }
  };
}
