import {
  collection,
  addDoc,
  doc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { 
  calculateMaintenanceSchedules 
} from "@/utils/maintenanceScheduler";
import { Product } from "@/types/product";

/**
 * Generates maintenance documents for a maintenance contract
 * Creates maintenance schedules based on each product's maintenance interval
 * 
 * @param contractId - The ID of the created contract
 * @param productIds - Array of product IDs in the contract
 * @param contractStartDate - Start date of the contract
 * @param contractEndDate - End date of the contract
 * @returns Promise that resolves when all maintenances are created
 * 
 * @throws Will log errors if product fetch fails or maintenance creation fails
 */
export async function generateMaintenancesForContract(
  contractId: string,
  productIds: string[],
  contractStartDate: Date,
  contractEndDate: Date
): Promise<void> {
  try {
    console.log(`Generating maintenances for contract ${contractId}`);
    
    const contractRef = doc(firestore, "contracts", contractId);
    
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
        
        // Calculate maintenance schedules
        const schedules = calculateMaintenanceSchedules(
          contractStartDate,
          contractEndDate,
          maintenanceInterval
        );
        
        console.log(`Creating ${schedules.length} maintenances for product ${productData.name}`);
        
        // Create maintenance document for each schedule
        for (const schedule of schedules) {
          await addDoc(collection(firestore, "maintenances"), {
            contract: contractRef,
            product: productRef,
            productType: productData.productType,
            engineer: null, // No engineer assigned initially
            status: "pending", // Initial status
            startDate: schedule.startDate,
            endDate: schedule.endDate,
            inspection: null, // No inspection initially
            createdAt: serverTimestamp(),
            createdBy: null, // System-generated
          });
        }
        
        console.log(`Successfully created ${schedules.length} maintenances for product ${productData.name}`);
        
      } catch (productError) {
        console.error(`Error processing product ${productId}:`, productError);
        // Continue with other products even if one fails
      }
    }
    
    console.log(`Maintenance generation completed for contract ${contractId}`);
    
  } catch (error) {
    console.error("Error generating maintenances:", error);
    throw error; // Re-throw to handle in the calling function
  }
}