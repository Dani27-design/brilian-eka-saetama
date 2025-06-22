import { DocumentReference, Timestamp } from "firebase/firestore";

export type Contract = {
  id: string;
  contractNumber: string;
  contractName: string;
  contractType: "service" | "maintenance" | "rental" | "sales" | "other";
  contractDescription: string;
  customer: DocumentReference;
  startDate: Timestamp;
  endDate: Timestamp | null; // null if contract is ongoing and not yet set end date of contract
  status: "active" | "inactive" | "terminated"; // first create status is active
  // can be multiple products in a contract
  // products are references to Product documents
  // can't be empty, at least one product must be selected
  // can't be same product in the same contract
  // can't be same product in different contracts
  products: DocumentReference[];
  productDetails: // details of each product in the contract
  Array<{
    product: DocumentReference;
    location: string;
    // checkboxes for product services, can check multiple, minimum one must be checked
    maintenance: boolean; // true if maintenance is checked for this product
    service: boolean; // true if service is checked for this product
    rental: boolean; // true if rental is checked for this product
    sales: boolean; // true if sales is checked for this product
  }>;
  createdBy?: DocumentReference;
  updatedBy?: DocumentReference;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};
