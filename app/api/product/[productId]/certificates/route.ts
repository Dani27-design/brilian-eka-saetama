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

    for (const maintenanceDoc of paginatedMaintenances) {
      const maintenance = maintenanceDoc.data() as Maintenance;
      const maintenanceId = maintenanceDoc.id;

      try {
        // Fetch contract data for location information (same as admin page)
        let location = "N/A";
        let contractData: any = {};
        let productDetails: ProductDetail[] = [];
        
        if (maintenance.contract) {
          const contractDoc = await getDoc(maintenance.contract);
          if (contractDoc.exists()) {
            contractData = contractDoc.data();
            productDetails = contractData.productDetails || [];
            
            // Fetch customer data if available
            if (contractData.customer) {
              const customerDoc = await getDoc(contractData.customer);
              if (customerDoc.exists()) {
                contractData.customerData = customerDoc.data();
              }
            }
            
            // Find location for this product using the same utility as admin page
            console.log("Debug location mapping:", {
              productId: maintenance.product?.id,
              productDetailsLength: productDetails?.length,
              productDetails: productDetails?.map(pd => ({
                productId: pd?.product?.id,
                location: pd?.location
              }))
            });
            location = findProductLocation(maintenance.product, productDetails);
            console.log("Found location:", location);
          }
        }

        // Calculate checklist summary
        const checklist = maintenance.inspection!.checklist;
        const totalItems = checklist.length;
        const passedItems = checklist.filter(item => item.status === true).length;
        const failedItems = totalItems - passedItems;
        const passRate = totalItems > 0 ? Math.round((passedItems / totalItems) * 100) : 0;

        // Generate certificate number (consistent with existing system)
        const inspectionDate = maintenance.inspection!.createdAt?.toDate() || new Date();
        const year = inspectionDate.getFullYear();
        const month = String(inspectionDate.getMonth() + 1).padStart(2, '0');
        const cleanProductNumber = (productData.productNumber?.toString() || "0").replace(/[^A-Z0-9]/gi, '');
        const certificateNumber = `CERT-${year}-${month}-${maintenance.productType}-${cleanProductNumber}`;

        // Calculate validity (1 year from inspection date)
        const validUntilDate = new Date(inspectionDate);
        validUntilDate.setFullYear(validUntilDate.getFullYear() + 1);

        // Get engineer names (resolve references like admin page)
        const engineerNames: string[] = [];
        if (Array.isArray(maintenance.engineer) && maintenance.engineer.length > 0) {
          for (const engineerRef of maintenance.engineer) {
            try {
              const engineerSnap = await getDoc(engineerRef);
              if (engineerSnap.exists()) {
                const engineerData = engineerSnap.data();
                engineerNames.push(engineerData.name || engineerSnap.id);
              }
            } catch (engineerError) {
              console.warn("Failed to fetch engineer:", engineerError);
            }
          }
        }
        
        // Fallback to simplified name if no engineers found
        if (engineerNames.length === 0) {
          engineerNames.push("Inspector");
        }
        
        // Get approver name (resolve updatedBy reference - this is who approved the inspection)
        let approverName = "Certificate Authority";
        if (maintenance.updatedBy) {
          try {
            const approverSnap = await getDoc(maintenance.updatedBy);
            if (approverSnap.exists()) {
              const approverData = approverSnap.data();
              // Use same fallback logic as admin page
              approverName = approverData.name || approverData.email || "Certificate Authority";
            }
          } catch (approverError) {
            console.warn("Failed to fetch approver:", approverError);
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
          // Include raw data for client-side PDF generation with resolved references (like admin page)
          rawMaintenanceData: maintenance,
          rawContractData: contractData,
          rawProductData: productData,
          resolvedEngineerNames: engineerNames,
          resolvedApproverName: approverName,
          resolvedLocation: location,
        };

        certificates.push(certificate);

      } catch (certError) {
        console.warn(`Failed to process certificate for maintenance ${maintenanceId}:`, certError);
        // Continue processing other certificates
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
    console.error("Error fetching product certificates:", error);
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