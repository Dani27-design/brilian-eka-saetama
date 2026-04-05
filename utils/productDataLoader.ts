import {
  getDoc,
  doc,
  DocumentReference,
} from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { Product } from "@/types/product";

/**
 * Batch loads contracts by their IDs
 */
async function batchGetContracts(contractIds: string[]): Promise<Map<string, any>> {
  const contractsMap = new Map<string, any>();
  if (contractIds.length === 0) return contractsMap;

  try {
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
    console.error("Error batch loading contracts:", error instanceof Error ? error.message : "Unknown error");
  }

  return contractsMap;
}

/**
 * Batch loads customers by their IDs
 */
async function batchGetCustomers(customerIds: string[]): Promise<Map<string, any>> {
  const customersMap = new Map<string, any>();
  if (customerIds.length === 0) return customersMap;

  try {
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
    console.error("Error batch loading customers:", error instanceof Error ? error.message : "Unknown error");
  }

  return customersMap;
}

/**
 * Enriches products with contract and customer data using batch loading
 * Replaces N+1 query pattern (1 query per product) with batch pattern (3 queries total)
 */
export async function enrichProductsWithContracts(
  products: Product[]
): Promise<(Product & { contractData?: any })[]> {
  // 1. Extract unique contract IDs from products that have contracts
  const contractIds = [...new Set(
    products
      .filter(p => p.contract)
      .map(p => (p.contract as DocumentReference).id)
  )];

  // 2. Batch fetch all contracts in parallel
  const contractsMap = await batchGetContracts(contractIds);

  // 3. Extract unique customer IDs from fetched contracts
  const customerIds = [...new Set(
    [...contractsMap.values()]
      .filter(c => c.customer && c.customer.id)
      .map(c => c.customer.id)
  )];

  // 4. Batch fetch all customers in parallel
  const customersMap = await batchGetCustomers(customerIds);

  // 5. Assemble enriched products
  return products.map(product => {
    const contractRef = product.contract as DocumentReference;
    if (!contractRef) return product;

    const contractData = contractsMap.get(contractRef.id);
    if (!contractData) return product;

    const customerData = contractData.customer
      ? customersMap.get(contractData.customer.id) || null
      : null;

    return {
      ...product,
      contractData: {
        ...contractData,
        customerData,
      },
    };
  });
}
