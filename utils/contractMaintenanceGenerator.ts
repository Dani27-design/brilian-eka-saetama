import {
  collection,
  doc,
  serverTimestamp,
  getDoc,
  writeBatch,
} from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import {
  calculateMaintenanceSchedules
} from "@/utils/maintenanceScheduler";
import { Product } from "@/types/product";

/**
 * Generates maintenance documents for a maintenance contract
 * Uses batch fetch for products and batch write for maintenances
 *
 * @param contractId - The ID of the created contract
 * @param productIds - Array of product IDs in the contract
 * @param contractStartDate - Start date of the contract
 * @param contractEndDate - End date of the contract
 * @returns Promise that resolves when all maintenances are created
 */
export async function generateMaintenancesForContract(
  contractId: string,
  productIds: string[],
  contractStartDate: Date,
  contractEndDate: Date
): Promise<void> {
  try {
    const contractRef = doc(firestore, "contracts", contractId);

    // Batch fetch all products in parallel
    const productSnaps = await Promise.all(
      productIds.map(id => getDoc(doc(firestore, "products", id)))
    );

    // Build all maintenance documents
    const maintenanceDocs: Array<{
      contract: any;
      product: any;
      productType: string;
      engineer: null;
      status: string;
      startDate: Date;
      endDate: Date;
      inspection: null;
      createdAt: any;
      createdBy: null;
    }> = [];

    for (let i = 0; i < productSnaps.length; i++) {
      const productSnap = productSnaps[i];
      const productId = productIds[i];

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

      const productRef = doc(firestore, "products", productId);
      const schedules = calculateMaintenanceSchedules(
        contractStartDate,
        contractEndDate,
        maintenanceInterval
      );

      for (const schedule of schedules) {
        maintenanceDocs.push({
          contract: contractRef,
          product: productRef,
          productType: productData.productType,
          engineer: null,
          status: "pending",
          startDate: schedule.startDate,
          endDate: schedule.endDate,
          inspection: null,
          createdAt: serverTimestamp(),
          createdBy: null,
        });
      }
    }

    // Batch write all maintenances (500 per batch limit)
    const BATCH_SIZE = 500;
    for (let i = 0; i < maintenanceDocs.length; i += BATCH_SIZE) {
      const batchDocs = maintenanceDocs.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(firestore);

      for (const maintenance of batchDocs) {
        const newDocRef = doc(collection(firestore, "maintenances"));
        batch.set(newDocRef, maintenance);
      }

      await batch.commit();
    }
  } catch (error) {
    console.error("Error generating maintenances:", error instanceof Error ? error.message : "Unknown error");
    throw error;
  }
}
