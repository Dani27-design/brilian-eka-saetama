import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
  DocumentReference,
} from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { Maintenance } from "@/types/maintenances";
import { Product } from "@/types/product";
import { calculateMaintenanceSchedules } from "./maintenanceScheduler";

/**
 * Safely converts a Firestore Timestamp, Date, string, or number to a Date object
 */
function toSafeDate(value: any): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return new Date();
}

/**
 * Represents an existing maintenance date range
 */
interface MaintenanceDateRange {
  startDate: Date;
  endDate: Date;
  maintenanceId: string;
}

/**
 * Gets all existing maintenances for a specific contract and product
 */
async function getExistingMaintenancesForProduct(
  contractId: string,
  productId: string
): Promise<Maintenance[]> {
  try {
    const contractRef = doc(firestore, "contracts", contractId);
    const productRef = doc(firestore, "products", productId);
    
    const maintenancesQuery = query(
      collection(firestore, "maintenances"),
      where("contract", "==", contractRef),
      where("product", "==", productRef)
    );
    
    const snapshot = await getDocs(maintenancesQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Maintenance));
  } catch (error) {
    console.error(`Error fetching existing maintenances for product ${productId}:`, error instanceof Error ? error.message : "Unknown error");
    return [];
  }
}

/**
 * Extracts date ranges from existing maintenances
 */
function extractDateRanges(maintenances: Maintenance[]): MaintenanceDateRange[] {
  return maintenances
    .filter(m => m.startDate && m.endDate)
    .map(m => ({
      startDate: toSafeDate(m.startDate),
      endDate: toSafeDate(m.endDate),
      maintenanceId: m.id || ''
    }))
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}

/**
 * Finds the last covered date from existing maintenances
 */
function findLastCoveredDate(dateRanges: MaintenanceDateRange[]): Date | null {
  if (dateRanges.length === 0) return null;
  
  // Get the maximum end date from all ranges
  const lastDate = dateRanges.reduce((max, range) => {
    return range.endDate > max ? range.endDate : max;
  }, dateRanges[0].endDate);
  
  return lastDate;
}

/**
 * Calculates the starting date for new maintenance generation
 */
function calculateNewMaintenanceStartDate(
  lastCoveredDate: Date | null,
  contractStartDate: Date
): Date {
  if (!lastCoveredDate) {
    // No existing maintenances, start from contract start date
    return contractStartDate;
  }
  
  // Start from the day after the last covered date
  const nextDate = new Date(lastCoveredDate);
  nextDate.setDate(nextDate.getDate() + 1);
  
  return nextDate;
}

/**
 * Generates maintenances only for uncovered periods
 */
async function generateMaintenancesForUncoveredPeriod(
  contractId: string,
  productId: string,
  startDate: Date,
  endDate: Date,
  productType: string,
  maintenanceInterval: number
): Promise<void> {
  try {
    const contractRef = doc(firestore, "contracts", contractId);
    const productRef = doc(firestore, "products", productId);
    
    // Calculate schedules for the uncovered period
    const schedules = calculateMaintenanceSchedules(
      startDate,
      endDate,
      maintenanceInterval
    );

    // Create maintenance documents for each schedule
    for (const schedule of schedules) {
      await addDoc(collection(firestore, "maintenances"), {
        contract: contractRef,
        product: productRef,
        productType: productType,
        engineer: null,
        status: "pending",
        startDate: Timestamp.fromDate(schedule.startDate),
        endDate: Timestamp.fromDate(schedule.endDate),
        inspection: null,
        createdAt: serverTimestamp(),
        createdBy: null, // System-generated
      });
    }
  } catch (error) {
    console.error(`Error generating maintenances for uncovered period:`, error instanceof Error ? error.message : "Unknown error");
    throw error;
  }
}

/**
 * Main function to regenerate maintenances for an extended contract
 * This function intelligently generates maintenances only for new/uncovered periods
 * 
 * @param contractId - The ID of the contract being edited
 * @param oldStartDate - Original contract start date
 * @param oldEndDate - Original contract end date
 * @param newStartDate - New contract start date
 * @param newEndDate - New contract end date
 * @param productIds - Array of product IDs in the contract
 * @param contractType - Type of contract (should be "maintenance" to trigger generation)
 */
export async function regenerateMaintenancesForExtendedContract(
  contractId: string,
  oldStartDate: Date | null,
  oldEndDate: Date | null,
  newStartDate: Date,
  newEndDate: Date | null,
  productIds: string[],
  contractType: string
): Promise<void> {
  try {
    // Only proceed if:
    // 1. Contract type is "maintenance"
    // 2. New end date exists
    // 3. Contract was extended (new end date > old end date) OR contract didn't have end date before
    if (contractType !== "maintenance" || !newEndDate) {
      return;
    }
    
    const shouldRegenerate = !oldEndDate || newEndDate > oldEndDate;

    if (!shouldRegenerate) {
      return;
    }

    // Process each product
    for (const productId of productIds) {
      try {
        // Fetch product details to get maintenance interval
        const productRef = doc(firestore, "products", productId);
        const productSnap = await getDoc(productRef);
        
        if (!productSnap.exists()) {
          console.error(`Product ${productId} not found`);
          continue;
        }
        
        const productData = productSnap.data() as Product;
        const maintenanceInterval = productData.maintenanceInterval;
        
        if (!maintenanceInterval || maintenanceInterval <= 0) {
          console.warn(`Product ${productId} has invalid maintenance interval: ${maintenanceInterval}`);
          continue;
        }
        
        // Get existing maintenances for this product
        const existingMaintenances = await getExistingMaintenancesForProduct(contractId, productId);

        if (existingMaintenances.length === 0) {
          // No existing maintenances, generate for entire contract period
          const schedules = calculateMaintenanceSchedules(
            newStartDate,
            newEndDate,
            maintenanceInterval
          );
          
          for (const schedule of schedules) {
            await addDoc(collection(firestore, "maintenances"), {
              contract: doc(firestore, "contracts", contractId),
              product: productRef,
              productType: productData.productType,
              engineer: null,
              status: "pending",
              startDate: Timestamp.fromDate(schedule.startDate),
              endDate: Timestamp.fromDate(schedule.endDate),
              inspection: null,
              createdAt: serverTimestamp(),
              createdBy: null,
            });
          }
        } else {
          // Has existing maintenances, only generate for uncovered period
          const dateRanges = extractDateRanges(existingMaintenances);
          const lastCoveredDate = findLastCoveredDate(dateRanges);
          
          if (lastCoveredDate && lastCoveredDate < newEndDate) {
            // There's an uncovered period
            const uncoveredStartDate = calculateNewMaintenanceStartDate(lastCoveredDate, newStartDate);

            await generateMaintenancesForUncoveredPeriod(
              contractId,
              productId,
              uncoveredStartDate,
              newEndDate,
              productData.productType,
              maintenanceInterval
            );
          }
        }
      } catch (productError) {
        console.error(`Error processing product ${productId} for regeneration:`, productError instanceof Error ? productError.message : "Unknown error");
        // Continue with other products even if one fails
      }
    }
  } catch (error) {
    console.error("Error in maintenance regeneration:", error instanceof Error ? error.message : "Unknown error");
    throw error;
  }
}

/**
 * Handles maintenance generation when new products are added to an existing maintenance contract
 * 
 * @param contractId - The contract ID
 * @param newProductIds - Array of newly added product IDs
 * @param contractStartDate - Contract start date
 * @param contractEndDate - Contract end date
 */
export async function generateMaintenancesForNewProducts(
  contractId: string,
  newProductIds: string[],
  contractStartDate: Date,
  contractEndDate: Date
): Promise<void> {
  try {
    const contractRef = doc(firestore, "contracts", contractId);
    
    for (const productId of newProductIds) {
      try {
        // Check if maintenances already exist for this product
        const existingMaintenances = await getExistingMaintenancesForProduct(contractId, productId);

        if (existingMaintenances.length > 0) {
          continue;
        }
        
        // Fetch product details
        const productRef = doc(firestore, "products", productId);
        const productSnap = await getDoc(productRef);
        
        if (!productSnap.exists()) {
          console.error(`Product ${productId} not found`);
          continue;
        }
        
        const productData = productSnap.data() as Product;
        const maintenanceInterval = productData.maintenanceInterval;
        
        if (!maintenanceInterval || maintenanceInterval <= 0) {
          console.warn(`Product ${productId} has invalid maintenance interval: ${maintenanceInterval}`);
          continue;
        }
        
        // Calculate maintenance schedules
        const schedules = calculateMaintenanceSchedules(
          contractStartDate,
          contractEndDate,
          maintenanceInterval
        );

        // Create maintenance documents
        for (const schedule of schedules) {
          await addDoc(collection(firestore, "maintenances"), {
            contract: contractRef,
            product: productRef,
            productType: productData.productType,
            engineer: null,
            status: "pending",
            startDate: Timestamp.fromDate(schedule.startDate),
            endDate: Timestamp.fromDate(schedule.endDate),
            inspection: null,
            createdAt: serverTimestamp(),
            createdBy: null,
          });
        }
      } catch (productError) {
        console.error(`Error processing new product ${productId}:`, productError instanceof Error ? productError.message : "Unknown error");
        // Continue with other products
      }
    }
  } catch (error) {
    console.error("Error generating maintenances for new products:", error instanceof Error ? error.message : "Unknown error");
    throw error;
  }
}