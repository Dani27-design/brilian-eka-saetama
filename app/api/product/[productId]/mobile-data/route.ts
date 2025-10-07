import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
} from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { ProductQRData } from "@/utils/qrCodeGenerator";

interface CustomerData {
  name: string;
  [key: string]: any;
}

/**
 * GET /api/product/[productId]/mobile-data
 *
 * Returns QR data structure for mobile engineer app compatibility using productId
 * This endpoint maintains the existing mobile app workflow while using secure identifiers
 *
 * Returns the same ProductQRData structure that would be in the QR code
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } },
) {
  try {
    const { productId } = params;

    // Validate product ID
    if (!productId) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 },
      );
    }

    // Get product by document ID (globally unique)
    const productRef = doc(firestore, "products", productId);
    const productDoc = await getDoc(productRef);

    if (!productDoc.exists()) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const productData = productDoc.data();

    // Find active contract for this product (if any)
    let contractId: string | undefined;
    let customerName: string | undefined;
    let location: string | undefined;

    try {
      const contractsQuery = query(
        collection(firestore, "contracts"),
        where("products", "array-contains", productRef),
        where("status", "==", "active"),
      );

      const contractSnapshot = await getDocs(contractsQuery);

      if (!contractSnapshot.empty) {
        const contractDoc = contractSnapshot.docs[0];
        const contractData = contractDoc.data();
        contractId = contractDoc.id;
        location = contractData.location;

        // Get customer name if available
        if (contractData.customer) {
          const customerDoc = await getDoc(contractData.customer);
          if (customerDoc.exists()) {
            const customerData = customerDoc.data() as CustomerData;
            customerName = customerData.name;
          }
        }
      }
    } catch (contractError) {
      console.warn("Could not fetch contract data:", contractError);
      // Continue without contract data
    }

    // Generate the QR data structure that mobile app expects
    const qrData: ProductQRData = {
      productId,
      productNumber: productData.productNumber?.toString() || "0", // Keep as string for display
      productName: productData.name || "Unknown Product",
      productType: productData.productType,
      brand: productData.specs?.brand || "N/A",
      serialNumber: productData.specs?.serialNumber || undefined,
      contractId: contractId || undefined,
      customerName: customerName || undefined,
      maintenanceInterval: productData.maintenanceInterval || 0,
      location: location || productData.location || undefined,
      generatedAt: new Date().toISOString(),
      version: "1.0",
      publicUrl: `${
        process.env.NEXT_PUBLIC_APP_URL ||
        "https://brilian-eka-saetama.vercel.app"
      }/product/${productId}/certificates`,
    };

    // Set CORS headers for mobile app access
    const response = NextResponse.json(qrData);
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, X-App-Type",
    );

    return response;
  } catch (error) {
    console.error("Error fetching mobile data:", error);
    return NextResponse.json(
      { error: "Failed to fetch product data" },
      { status: 500 },
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
      "Access-Control-Allow-Headers": "Content-Type, X-App-Type",
    },
  });
}
