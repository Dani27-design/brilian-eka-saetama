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
    console.error(`Error fetching existing maintenances for product ${productId}:`, error);
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
      startDate: m.startDate.toDate(),
      endDate: m.endDate.toDate(),
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
    
    console.log(`Creating ${schedules.length} new maintenances for uncovered period`);
    
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
    
    console.log(`Successfully created ${schedules.length} maintenances for uncovered period`);
  } catch (error) {
    console.error(`Error generating maintenances for uncovered period:`, error);
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
      console.log("Skipping maintenance regeneration: Not a maintenance contract or no end date");
      return;
    }
    
    const shouldRegenerate = !oldEndDate || newEndDate > oldEndDate;
    
    if (!shouldRegenerate) {
      console.log("Skipping maintenance regeneration: Contract not extended");
      return;
    }
    
    console.log(`Regenerating maintenances for extended contract ${contractId}`);
    
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
          console.log(`No existing maintenances found for product ${productId}, generating full schedule`);
          
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
          
          console.log(`Created ${schedules.length} maintenances for product ${productId}`);
        } else {
          // Has existing maintenances, only generate for uncovered period
          const dateRanges = extractDateRanges(existingMaintenances);
          const lastCoveredDate = findLastCoveredDate(dateRanges);
          
          if (lastCoveredDate && lastCoveredDate < newEndDate) {
            // There's an uncovered period
            const uncoveredStartDate = calculateNewMaintenanceStartDate(lastCoveredDate, newStartDate);
            
            console.log(`Generating maintenances for uncovered period: ${uncoveredStartDate.toISOString()} to ${newEndDate.toISOString()}`);
            
            await generateMaintenancesForUncoveredPeriod(
              contractId,
              productId,
              uncoveredStartDate,
              newEndDate,
              productData.productType,
              maintenanceInterval
            );
          } else {
            console.log(`Product ${productId} already fully covered by existing maintenances`);
          }
        }
      } catch (productError) {
        console.error(`Error processing product ${productId} for regeneration:`, productError);
        // Continue with other products even if one fails
      }
    }
    
    console.log(`Maintenance regeneration completed for contract ${contractId}`);
  } catch (error) {
    console.error("Error in maintenance regeneration:", error);
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
    console.log(`Generating maintenances for ${newProductIds.length} new products in contract ${contractId}`);
    
    const contractRef = doc(firestore, "contracts", contractId);
    
    for (const productId of newProductIds) {
      try {
        // Check if maintenances already exist for this product
        const existingMaintenances = await getExistingMaintenancesForProduct(contractId, productId);
        
        if (existingMaintenances.length > 0) {
          console.log(`Product ${productId} already has maintenances, skipping`);
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
        
        console.log(`Creating ${schedules.length} maintenances for new product ${productData.name}`);
        
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
        
        console.log(`Successfully created ${schedules.length} maintenances for product ${productData.name}`);
      } catch (productError) {
        console.error(`Error processing new product ${productId}:`, productError);
        // Continue with other products
      }
    }
    
    console.log(`Completed maintenance generation for new products in contract ${contractId}`);
  } catch (error) {
    console.error("Error generating maintenances for new products:", error);
    throw error;
  }
}