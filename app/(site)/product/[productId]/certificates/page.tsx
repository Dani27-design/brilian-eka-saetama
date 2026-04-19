import { Metadata } from "next";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import PublicCertificatesClient from "./PublicCertificatesClient";

interface PageProps {
  params: {
    productId: string;
  };
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
}

/**
 * Generate metadata for the public certificates page
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { productId } = params;

  return {
    title: `Sertifikat Inspeksi Produk`,
    description: `Lihat semua sertifikat inspeksi untuk produk ini. Rekaman inspeksi dan sertifikat kepatuhan peralatan keselamatan kebakaran.`,
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: `Sertifikat Inspeksi Produk`,
      description: `Sertifikat inspeksi dan catatan kepatuhan peralatan keselamatan kebakaran`,
      type: "website",
    },
  };
}

/**
 * Public page for viewing product inspection certificates
 * 
 * This page handles two scenarios:
 * 1. Mobile Engineer App: Returns JSON data for existing QR workflow
 * 2. Web Browser: Shows public certificate listing page
 * 
 * Route: /product/[productId]/certificates
 */
export default async function PublicCertificatesPage({ params, searchParams }: PageProps) {
  const { productId } = params;
  
  // Check if there's embedded QR data in the URL (for hybrid QR codes)
  const embeddedData = searchParams.data;
  if (embeddedData && typeof embeddedData === 'string') {
    try {
      // Decode the embedded product data
      const decodedData = Buffer.from(embeddedData, 'base64').toString('utf-8');
      const productData = JSON.parse(decodedData);
      console.log('Embedded product data found:', productData);
      // This data could be used to enhance the page or for mobile app compatibility
    } catch (error) {
      console.warn('Failed to decode embedded data:', error);
      // Continue normally without embedded data
    }
  }
  
  // Get headers for mobile app detection
  const headersList = headers();
  const userAgent = headersList.get("user-agent") || "";
  const appType = headersList.get("x-app-type") || "";
  
  // Detect if request is from mobile engineer app
  const isMobileApp = 
    userAgent.includes("bes-firecheck") ||           // Package name
    userAgent.includes("FireCheck PT BES") ||        // Display name
    userAgent.includes("com.bes_firecheck.app") ||   // Full package name
    appType === "mobile-engineer" ||                 // Custom header
    userAgent.includes("ReactNative");               // React Native user agent
  
  // If request is from mobile app, the QR scanning should NOT open this page
  // The mobile app should read the QR data directly and use it for the inspection workflow
  // This page is only for web browsers viewing certificates
  if (isMobileApp) {
    // Mobile app shouldn't reach this page - it should read QR data directly
    // But if it does, redirect to a mobile-friendly error page or show simple message
    return new Response("This URL is for web certificate viewing. Please use QR data directly in the mobile app.", {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // For web browsers, render the certificate listing page
  return <PublicCertificatesClient productId={productId} />;
}