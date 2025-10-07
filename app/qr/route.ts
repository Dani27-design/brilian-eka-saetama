import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { Product } from "@/types/product";

/**
 * Universal QR Route Handler
 * 
 * Provides universal QR functionality that works for both:
 * 1. Native phone cameras → Redirect to certificate page
 * 2. Mobile inspection app → Return JSON product data
 * 
 * URL Format: https://brilian-eka-saetama.vercel.app/qr?pid={productId}
 * 
 * Detection Logic:
 * - Browser requests → 302 redirect to certificate page
 * - Mobile app requests → JSON response with product data
 */

/**
 * Detects if the request is from a mobile inspection app
 * Uses multiple detection methods for reliability
 */
function isMobileAppRequest(request: NextRequest): boolean {
  // Method 1: Custom header (most reliable)
  const appHeader = request.headers.get("x-app-type");
  if (appHeader === "inspection-app") {
    return true;
  }

  // Method 2: User-Agent analysis
  const userAgent = request.headers.get("user-agent") || "";
  
  // React Native patterns
  if (userAgent.includes("ReactNative") || 
      userAgent.includes("okhttp") || 
      userAgent.includes("CFNetwork")) {
    return true;
  }

  // BES FireCheck app identifiers (actual app User-Agents)
  if (userAgent.includes("BES-FireCheck-Inspection-App") || 
      userAgent.includes("InspectionApp") ||
      userAgent.includes("BESFireCheck")) {
    return true;
  }

  // Method 3: Accept header analysis
  const acceptHeader = request.headers.get("accept") || "";
  
  // Mobile apps typically request JSON first
  if (acceptHeader.startsWith("application/json") && 
      !acceptHeader.includes("text/html")) {
    return true;
  }

  return false;
}

/**
 * Validates and sanitizes product ID
 */
function validateProductId(pid: string | null): string | null {
  if (!pid || typeof pid !== 'string') {
    return null;
  }

  // Basic sanitization
  const sanitized = pid.trim();
  
  // Validate format (Firestore document ID pattern)
  if (!/^[a-zA-Z0-9_-]{1,1500}$/.test(sanitized)) {
    return null;
  }

  return sanitized;
}

/**
 * GET /qr?pid={productId}
 * 
 * Universal handler for QR code requests
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const productId = validateProductId(url.searchParams.get("pid"));

    if (!productId) {
      return NextResponse.json(
        { error: "Invalid or missing product ID" },
        { status: 400 }
      );
    }

    // Get product data from Firestore
    const productRef = doc(firestore, "products", productId);
    const productDoc = await getDoc(productRef);

    if (!productDoc.exists()) {
      // For browsers, redirect to 404 page
      if (!isMobileAppRequest(request)) {
        return NextResponse.redirect(new URL("/404", request.url));
      }

      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const productData = productDoc.data() as Product;

    // MOBILE APP REQUEST - Return JSON data
    if (isMobileAppRequest(request)) {
      const responseData = {
        productId,
        productNumber: productData.productNumber?.toString() || "0",
        productName: productData.name || "Unknown Product",
        productType: productData.productType,
        brand: productData.specs?.brand || "N/A",
        serialNumber: productData.specs?.serialNumber || undefined,
        maintenanceInterval: productData.maintenanceInterval || 30,
        generatedAt: new Date().toISOString(),
        version: "1.0",
        publicUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://brilian-eka-saetama.vercel.app"}/product/${productId}/certificates`
      };

      // Set CORS headers for mobile app access
      const response = NextResponse.json(responseData);
      response.headers.set("Access-Control-Allow-Origin", "*");
      response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, X-App-Type");
      response.headers.set("Cache-Control", "public, max-age=300"); // 5 minutes cache
      
      return response;
    }

    // BROWSER REQUEST - Redirect to certificate page
    const certificateUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://brilian-eka-saetama.vercel.app"}/product/${productId}/certificates`;
    
    return NextResponse.redirect(certificateUrl, {
      status: 302,
      headers: {
        "Cache-Control": "public, max-age=300" // 5 minutes cache
      }
    });

  } catch (error) {
    console.error("QR route error:", error);

    // For browsers, redirect to error page
    if (!isMobileAppRequest(request)) {
      return NextResponse.redirect(new URL("/error", request.url));
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 * Required for mobile app requests
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