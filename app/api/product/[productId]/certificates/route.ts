import { NextRequest, NextResponse } from "next/server";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc, 
  orderBy 
} from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { Maintenance } from "@/types/maintenances";
import { formatToWIB, formatDateOnlyWIB } from "@/utils/dateFormatter";
import { findProductLocation, ProductDetail } from "@/utils/findProductLocation";

/**
 * Public certificate data structure for API response
 * Contains only non-sensitive information for public viewing
 */
interface PublicCertificateData {
  certificateNumber: string;
  issueDate: string;
  validUntil?: string;
  inspectionDate: string;
  engineerNames: string[];
  status: "approved";
  checklistSummary: {
    totalItems: number;
    passedItems: number;
    failedItems: number;
    passRate: number;
  };
  productInfo: {
    productNumber: string;
    productName: string;
    productType: string;
    brand: string;
    location: string;
  };
  downloadUrl: string;
  // Raw data for client-side PDF generation
  rawMaintenanceData?: any;
  rawContractData?: any;
  rawProductData?: any;
  // Resolved reference data
  resolvedEngineerNames: string[];
  resolvedApproverName: string;
  resolvedLocation: string;
}

/**
 * Product information for header display
 */
interface PublicProductInfo {
  productNumber: string;
  productName: string;
  productType: string;
  brand: string;
  currentLocation?: string;
}

/**
 * GET /api/product/[productId]/certificates
 * 
 * Fetches all approved inspection certificates for a specific product using productId
 * Public endpoint - no authentication required
 * 
 * Query parameters:
 * - limit: number of certificates to return (default: 10, max: 50)
 * - offset: pagination offset (default: 0)
 * 
 * Returns:
 * - certificates: array of public certificate data
 * - productInfo: basic product information
 * - totalCount: total number of certificates available
 * - hasMore: boolean indicating if more certificates are available
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params;
    const url = new URL(request.url);
    
    // Parse query parameters
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "10"), 
      50 // Max 50 certificates per request
    );
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Validate product ID
    if (!productId) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    // Get product by document ID (globally unique)
    const productRef = doc(firestore, "products", productId);
    const productDoc = await getDoc(productRef);
    
    if (!productDoc.exists()) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const productData = productDoc.data();

    // Get all approved maintenances for this product
    const maintenancesQuery = query(
      collection(firestore, "maintenances"),
      where("product", "==", productRef),
      where("status", "==", "approved"),
      orderBy("createdAt", "desc")
    );

    const maintenanceSnapshot = await getDocs(maintenancesQuery);
    
    if (maintenanceSnapshot.empty) {
      // Return product info even if no certificates exist
      const productInfo: PublicProductInfo = {
        productNumber: productData.productNumber?.toString() || "N/A",
        productName: productData.name || "Unknown Product",
        productType: productData.productType || "N/A",
        brand: productData.specs?.brand || "N/A",
        currentLocation: productData.location || undefined,
      };

      return NextResponse.json({
        certificates: [],
        productInfo,
        totalCount: 0,
        hasMore: false,
      });
    }

    // Filter only maintenances with inspection data
    const maintenancesWithInspection = maintenanceSnapshot.docs.filter(doc => {
      const maintenance = doc.data() as Maintenance;
      return maintenance.inspection && 
             maintenance.inspection.checklist && 
             maintenance.inspection.checklist.length > 0;
    });

    // Apply pagination
    const totalCount = maintenancesWithInspection.length;
    const paginatedMaintenances = maintenancesWithInspection.slice(offset, offset + limit);

    // Process certificates
    const certificates: PublicCertificateData[] = [];

    // === BATCH LOAD all related data to avoid N+1 queries ===

    // 1. Extract unique contract IDs
    const contractIds = [...new Set(
      paginatedMaintenances
        .map(d => (d.data() as Maintenance).contract)
        .filter(Boolean)
        .map(ref => ref.id)
    )];

    // 2. Batch fetch all contracts
    const contractsMap = new Map<string, any>();
    if (contractIds.length > 0) {
      const contractSnaps = await Promise.all(
        contractIds.map(id => getDoc(doc(firestore, "contracts", id)))
      );
      contractSnaps.forEach((snap, i) => {
        if (snap.exists()) {
          contractsMap.set(contractIds[i], { id: snap.id, ...snap.data() });
        }
      });
    }

    // 3. Extract unique customer IDs from contracts
    const customerIds = [...new Set(
      [...contractsMap.values()]
        .filter(c => c.customer && c.customer.id)
        .map(c => c.customer.id)
    )];

    // 4. Batch fetch all customers
    const customersMap = new Map<string, any>();
    if (customerIds.length > 0) {
      const customerSnaps = await Promise.all(
        customerIds.map(id => getDoc(doc(firestore, "customers", id)))
      );
      customerSnaps.forEach((snap, i) => {
        if (snap.exists()) {
          customersMap.set(customerIds[i], { id: snap.id, ...snap.data() });
        }
      });
    }

    // 5. Extract unique user IDs (engineers + approvers)
    const userIds = new Set<string>();
    paginatedMaintenances.forEach(d => {
      const m = d.data() as Maintenance;
      if (Array.isArray(m.engineer)) {
        m.engineer.forEach(ref => { if (ref && ref.id) userIds.add(ref.id); });
      }
      if (m.updatedBy && m.updatedBy.id) userIds.add(m.updatedBy.id);
    });

    // 6. Batch fetch all users (engineers + approvers)
    const usersMap = new Map<string, any>();
    const userIdArray = [...userIds];
    if (userIdArray.length > 0) {
      const userSnaps = await Promise.all(
        userIdArray.map(id => getDoc(doc(firestore, "users", id)))
      );
      userSnaps.forEach((snap, i) => {
        if (snap.exists()) {
          usersMap.set(userIdArray[i], { id: snap.id, ...snap.data() });
        }
      });
    }

    for (const maintenanceDoc of paginatedMaintenances) {
      const maintenance = maintenanceDoc.data() as Maintenance;
      const maintenanceId = maintenanceDoc.id;

      try {
        // Look up contract from batch-loaded map
        let location = "N/A";
        let contractData: any = {};
        let productDetails: ProductDetail[] = [];

        if (maintenance.contract) {
          contractData = contractsMap.get(maintenance.contract.id) || {};
          productDetails = contractData.productDetails || [];

          // Look up customer from batch-loaded map
          if (contractData.customer) {
            contractData.customerData = customersMap.get(contractData.customer.id) || null;
          }

          // Find location for this product
          location = findProductLocation(maintenance.product, productDetails);
        }

        // Calculate checklist summary
        const checklist = maintenance.inspection!.checklist;
        const totalItems = checklist.length;
        const passedItems = checklist.filter(item => item.status === true).length;
        const failedItems = totalItems - passedItems;
        const passRate = totalItems > 0 ? Math.round((passedItems / totalItems) * 100) : 0;

        // Generate certificate number
        const inspectionDate = maintenance.inspection!.createdAt?.toDate() || new Date();
        const year = inspectionDate.getFullYear();
        const month = String(inspectionDate.getMonth() + 1).padStart(2, '0');
        const cleanProductNumber = (productData.productNumber?.toString() || "0").replace(/[^A-Z0-9]/gi, '');
        const certificateNumber = `CERT-${year}-${month}-${maintenance.productType}-${cleanProductNumber}`;

        // Calculate validity (1 year from inspection date)
        const validUntilDate = new Date(inspectionDate);
        validUntilDate.setFullYear(validUntilDate.getFullYear() + 1);

        // Look up engineer names from batch-loaded map
        const engineerNames: string[] = [];
        if (Array.isArray(maintenance.engineer) && maintenance.engineer.length > 0) {
          for (const engineerRef of maintenance.engineer) {
            const engineerData = usersMap.get(engineerRef.id);
            if (engineerData) {
              engineerNames.push(engineerData.name || engineerRef.id);
            }
          }
        }
        if (engineerNames.length === 0) {
          engineerNames.push("Inspector");
        }

        // Look up approver name from batch-loaded map
        let approverName = "Certificate Authority";
        if (maintenance.updatedBy) {
          const approverData = usersMap.get(maintenance.updatedBy.id);
          if (approverData) {
            approverName = approverData.name || approverData.email || "Certificate Authority";
          }
        }

        const certificate: PublicCertificateData = {
          certificateNumber,
          issueDate: formatToWIB(inspectionDate),
          validUntil: formatDateOnlyWIB(validUntilDate),
          inspectionDate: formatToWIB(inspectionDate),
          engineerNames,
          status: "approved",
          checklistSummary: {
            totalItems,
            passedItems,
            failedItems,
            passRate,
          },
          productInfo: {
            productNumber: productData.productNumber?.toString() || "N/A",
            productName: productData.name || "Unknown Product",
            productType: maintenance.productType,
            brand: productData.specs?.brand || "N/A",
            location,
          },
          downloadUrl: `/api/product/${productId}/certificates/${maintenanceId}/download`,
          rawMaintenanceData: maintenance,
          rawContractData: contractData,
          rawProductData: productData,
          resolvedEngineerNames: engineerNames,
          resolvedApproverName: approverName,
          resolvedLocation: location,
        };

        certificates.push(certificate);

      } catch (certError) {
        console.warn(`Failed to process certificate for maintenance ${maintenanceId}:`, certError instanceof Error ? certError.message : "Unknown error");
        continue;
      }
    }

    // Prepare product info for header
    const productInfo: PublicProductInfo = {
      productNumber: productData.productNumber?.toString() || "N/A",
      productName: productData.name || "Unknown Product",
      productType: productData.productType || "N/A",
      brand: productData.specs?.brand || "N/A",
      currentLocation: productData.location || undefined,
    };

    // Set cache headers for performance (5 minutes cache)
    const response = NextResponse.json({
      certificates,
      productInfo,
      totalCount,
      hasMore: offset + limit < totalCount,
    });

    response.headers.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
    
    return response;

  } catch (error) {
    console.error("Error fetching product certificates:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to fetch certificates" },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS support
 * Allows the mobile engineer app to access this endpoint
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-App-Type",
    },
  });
}