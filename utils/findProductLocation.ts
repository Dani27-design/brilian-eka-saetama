import { DocumentReference } from "firebase/firestore";

/**
 * Represents a product detail entry from a contract
 */
export interface ProductDetail {
  product: DocumentReference;
  location: string;
  maintenance: boolean;
  service: boolean;
  rental: boolean;
  sales: boolean;
}

/**
 * Finds the location of a specific product within a contract's product details
 * Matches the product reference ID with the productDetails array
 * 
 * @param productRef - The DocumentReference of the product to find
 * @param productDetails - Array of product details from contract document
 * @returns The location string or "N/A" if not found
 * 
 * @example
 * const productRef = doc(firestore, "products", "product123");
 * const productDetails = [
 *   { product: productRef, location: "Building A - Floor 1", ... },
 *   { product: otherRef, location: "Building B - Floor 2", ... }
 * ];
 * 
 * findProductLocation(productRef, productDetails)
 * // Returns: "Building A - Floor 1"
 * 
 * @example
 * // Product not found
 * findProductLocation(unknownRef, productDetails)
 * // Returns: "N/A"
 */
export function findProductLocation(
  productRef: DocumentReference | null | undefined,
  productDetails: ProductDetail[] | null | undefined
): string {
  // Validate inputs
  if (!productRef || !productDetails || !Array.isArray(productDetails)) {
    console.warn("Invalid inputs for findProductLocation:", { 
      hasProductRef: !!productRef, 
      hasProductDetails: !!productDetails,
      isArray: Array.isArray(productDetails)
    });
    return "N/A";
  }

  try {
    // Find the matching product detail by comparing document reference IDs
    const matchingDetail = productDetails.find(detail => {
      // Handle cases where detail.product might be null or undefined
      if (!detail || !detail.product) {
        return false;
      }
      
      // Compare the document reference IDs
      return detail.product.id === productRef.id;
    });

    // Return location if found, otherwise return "N/A"
    if (matchingDetail && matchingDetail.location) {
      return matchingDetail.location.trim() || "N/A";
    }

    console.warn(`Product location not found for product ID: ${productRef.id}`);
    return "N/A";

  } catch (error) {
    console.error("Error finding product location:", error, {
      productId: productRef?.id,
      productDetailsCount: productDetails?.length
    });
    return "N/A";
  }
}

/**
 * Finds multiple product locations at once for efficiency
 * Useful when processing multiple products from the same contract
 * 
 * @param productRefs - Array of product DocumentReferences
 * @param productDetails - Array of product details from contract document
 * @returns Map of product ID to location string
 * 
 * @example
 * const productRefs = [productRef1, productRef2, productRef3];
 * const locations = findMultipleProductLocations(productRefs, productDetails);
 * // Returns: Map {
 * //   "product1" => "Building A - Floor 1",
 * //   "product2" => "Building B - Floor 2", 
 * //   "product3" => "N/A"
 * // }
 */
export function findMultipleProductLocations(
  productRefs: (DocumentReference | null | undefined)[],
  productDetails: ProductDetail[] | null | undefined
): Map<string, string> {
  const locationMap = new Map<string, string>();

  if (!productRefs || !Array.isArray(productRefs) || !productDetails) {
    console.warn("Invalid inputs for findMultipleProductLocations");
    return locationMap;
  }

  try {
    // Process each product reference
    productRefs.forEach(productRef => {
      if (productRef && productRef.id) {
        const location = findProductLocation(productRef, productDetails);
        locationMap.set(productRef.id, location);
      }
    });

  } catch (error) {
    console.error("Error finding multiple product locations:", error);
  }

  return locationMap;
}

/**
 * Validates that all products in a contract have locations assigned
 * Useful for contract validation
 * 
 * @param productDetails - Array of product details from contract document
 * @returns Object with validation result and details
 * 
 * @example
 * validateProductLocations(productDetails)
 * // Returns: {
 * //   isValid: false,
 * //   missingLocations: 2,
 * //   totalProducts: 5,
 * //   missingProductIds: ["product123", "product456"]
 * // }
 */
export function validateProductLocations(
  productDetails: ProductDetail[] | null | undefined
): {
  isValid: boolean;
  missingLocations: number;
  totalProducts: number;
  missingProductIds: string[];
  message: string;
} {
  const result = {
    isValid: true,
    missingLocations: 0,
    totalProducts: 0,
    missingProductIds: [] as string[],
    message: ""
  };

  if (!productDetails || !Array.isArray(productDetails)) {
    result.message = "No product details provided";
    result.isValid = false;
    return result;
  }

  try {
    result.totalProducts = productDetails.length;

    productDetails.forEach(detail => {
      if (!detail || !detail.location || detail.location.trim() === "") {
        result.missingLocations++;
        result.isValid = false;
        
        if (detail && detail.product && detail.product.id) {
          result.missingProductIds.push(detail.product.id);
        }
      }
    });

    if (result.isValid) {
      result.message = `All ${result.totalProducts} products have locations assigned`;
    } else {
      result.message = `${result.missingLocations} out of ${result.totalProducts} products missing locations`;
    }

  } catch (error) {
    console.error("Error validating product locations:", error);
    result.isValid = false;
    result.message = "Error during validation";
  }

  return result;
}

/**
 * Gets a summary of all unique locations in a contract
 * Useful for reporting and overview displays
 * 
 * @param productDetails - Array of product details from contract document
 * @returns Array of unique locations with product counts
 * 
 * @example
 * getLocationSummary(productDetails)
 * // Returns: [
 * //   { location: "Building A - Floor 1", productCount: 3 },
 * //   { location: "Building B - Floor 2", productCount: 2 },
 * //   { location: "N/A", productCount: 1 }
 * // ]
 */
export function getLocationSummary(
  productDetails: ProductDetail[] | null | undefined
): Array<{ location: string; productCount: number }> {
  if (!productDetails || !Array.isArray(productDetails)) {
    return [];
  }

  try {
    const locationCounts = new Map<string, number>();

    productDetails.forEach(detail => {
      const location = detail && detail.location && detail.location.trim() 
        ? detail.location.trim() 
        : "N/A";
      
      const currentCount = locationCounts.get(location) || 0;
      locationCounts.set(location, currentCount + 1);
    });

    // Convert map to array and sort by product count (descending)
    return Array.from(locationCounts.entries())
      .map(([location, productCount]) => ({ location, productCount }))
      .sort((a, b) => b.productCount - a.productCount);

  } catch (error) {
    console.error("Error getting location summary:", error);
    return [];
  }
}