import { NextRequest, NextResponse } from "next/server";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc 
} from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { Maintenance } from "@/types/maintenances";
import { 
  createCertificateData, 
  generateCertificatePDFBlob 
} from "@/utils/pdfCertificate";
import { findProductLocation, ProductDetail } from "@/utils/findProductLocation";

/**
 * GET /api/product/[productId]/certificates/[maintenanceId]/download
 * 
 * Downloads a specific inspection certificate as PDF using productId
 * Public endpoint for approved certificates only
 * 
 * Returns PDF file as blob with appropriate headers
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string; maintenanceId: string } }
) {
  try {
    const { productId, maintenanceId } = params;
    const url = new URL(request.url);
    
    // Check if this is a download request or preview request
    const download = url.searchParams.get("download") === "true";

    // Validate parameters
    if (!productId || !maintenanceId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Get maintenance document
    const maintenanceRef = doc(firestore, "maintenances", maintenanceId);
    const maintenanceDoc = await getDoc(maintenanceRef);

    if (!maintenanceDoc.exists()) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }

    const maintenanceData = maintenanceDoc.data() as Maintenance;

    // Verify this is an approved inspection with data
    if (maintenanceData.status !== "approved") {
      return NextResponse.json(
        { error: "Certificate not approved for public access" },
        { status: 403 }
      );
    }

    if (!maintenanceData.inspection || !maintenanceData.inspection.checklist) {
      return NextResponse.json(
        { error: "No inspection data available" },
        { status: 404 }
      );
    }

    // Verify product ID matches
    const productDoc = await getDoc(maintenanceData.product);
    if (!productDoc.exists()) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const productData = productDoc.data();
    if (productDoc.id !== productId) {
      return NextResponse.json(
        { error: "Product ID mismatch" },
        { status: 400 }
      );
    }

    // Fetch contract data (same as API route and admin page)
    let contractData: any = {};
    let productDetails: ProductDetail[] = [];
    if (maintenanceData.contract) {
      const contractDoc = await getDoc(maintenanceData.contract);
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
      }
    }

    // Get engineer names (resolve references like admin page and API route)
    const engineerNames: string[] = [];
    if (Array.isArray(maintenanceData.engineer) && maintenanceData.engineer.length > 0) {
      for (const engineerRef of maintenanceData.engineer) {
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

    // Get location using same utility as admin page and API route
    console.log("Download route - Debug location mapping:", {
      productId: maintenanceData.product?.id,
      productDetailsLength: productDetails?.length,
      productDetails: productDetails?.map(pd => ({
        productId: pd?.product?.id,
        location: pd?.location
      }))
    });
    const location = findProductLocation(maintenanceData.product, productDetails);
    console.log("Download route - Found location:", location);
    
    // Get approver name (resolve updatedBy reference like API route)
    let approverName = "Certificate Authority";
    if (maintenanceData.updatedBy) {
      try {
        const approverSnap = await getDoc(maintenanceData.updatedBy);
        if (approverSnap.exists()) {
          const approverData = approverSnap.data();
          approverName = approverData.name || approverData.email || "Certificate Authority";
        }
      } catch (approverError) {
        console.warn("Failed to fetch approver:", approverError);
      }
    }

    // Create certificate data
    const certificateData = createCertificateData(
      maintenanceData,
      contractData,
      productData,
      engineerNames,
      approverName, // Use resolved approver name
      location
    );

    // Generate PDF blob
    const pdfBlob = await generateCertificatePDFBlob(
      certificateData,
      "public_inspector", // Generic inspector ID for public certificates
      "public_approver"   // Generic approver ID for public certificates
    );

    // Convert blob to buffer for NextResponse
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate filename using product number for user-friendly naming
    const productNumber = productData.productNumber?.toString() || productId;
    const filename = `certificate_${productNumber}_${maintenanceId}.pdf`;

    // Create response with PDF headers
    // Use inline disposition for preview, attachment for download
    const contentDisposition = download 
      ? `attachment; filename="${filename}"`
      : `inline; filename="${filename}"`;

    const response = new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": contentDisposition,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=3600, immutable", // Cache for 1 hour
      },
    });

    return response;

  } catch (error) {
    console.error("Error generating certificate download:", error);
    return NextResponse.json(
      { error: "Failed to generate certificate" },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS support
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}