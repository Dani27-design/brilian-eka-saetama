"use client";

import { useState, useEffect } from "react";
import {
  createCertificateData,
  generateCertificatePDFBlob,
} from "@/utils/pdfCertificate";
import { MobileInspectionView } from "./MobileInspectionView";

// Export the interface for other components
export type { PublicCertificateData };

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
  // Raw data for PDF generation
  rawMaintenanceData?: any;
  rawContractData?: any;
  rawProductData?: any;
  // Resolved data (same as admin page)
  resolvedEngineerNames?: string[];
  resolvedApproverName?: string;
  resolvedLocation?: string;
}

interface PublicProductInfo {
  productNumber: string;
  productName: string;
  productType: string;
  brand: string;
  currentLocation?: string;
}

interface CertificatesResponse {
  certificates: PublicCertificateData[];
  productInfo: PublicProductInfo;
  totalCount: number;
  hasMore: boolean;
}

interface PublicCertificatesClientProps {
  productId: string;
}

export default function PublicCertificatesClient({
  productId,
}: PublicCertificatesClientProps) {
  const [data, setData] = useState<CertificatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCertificateIndex, setCurrentCertificateIndex] = useState(0);
  const [pdfBlobUrls, setPdfBlobUrls] = useState<{
    [certificateNumber: string]: string;
  }>({});
  const [generatingPdf, setGeneratingPdf] = useState<{
    [certificateNumber: string]: boolean;
  }>({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchCertificates();
  }, [productId]);

  // Detect mobile devices and small screens
  useEffect(() => {
    const checkIfMobile = () => {
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );
      const isSmallScreen = window.innerWidth <= 768;
      const isTouchDevice = "ontouchstart" in window;

      setIsMobile(isMobileDevice || isSmallScreen || isTouchDevice);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/product/${productId}/certificates`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch certificates");
      }

      const certificatesData: CertificatesResponse = await response.json();
      setData(certificatesData);

      // Generate PDF blob URLs for each certificate (skip on mobile for performance)
      if (certificatesData.certificates.length > 0 && !isMobile) {
        generatePdfBlobUrls(certificatesData.certificates);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const generatePdfBlobUrls = async (certificates: PublicCertificateData[]) => {
    const newBlobUrls: { [certificateNumber: string]: string } = {};
    const newGeneratingState: { [certificateNumber: string]: boolean } = {};

    for (const cert of certificates) {
      if (!cert.rawMaintenanceData || !cert.rawProductData) continue;

      try {
        newGeneratingState[cert.certificateNumber] = true;
        setGeneratingPdf((prev) => ({
          ...prev,
          [cert.certificateNumber]: true,
        }));

        // Follow the exact same pattern as the admin page
        // Use resolved data from API (same pattern as admin page)
        const location =
          cert.resolvedLocation ||
          cert.rawContractData?.location ||
          cert.rawContractData?.customerData?.address ||
          cert.rawProductData?.location ||
          "N/A";

        // Use resolved engineer names and approver (same as admin page)
        const engineerNames = cert.resolvedEngineerNames ||
          cert.engineerNames || ["Inspector"];
        const approverName =
          cert.resolvedApproverName || "Certificate Authority";

        // Create certificate data using exact same pattern as admin page
        const certificateData = createCertificateData(
          cert.rawMaintenanceData,
          cert.rawContractData || {},
          cert.rawProductData,
          engineerNames,
          approverName,
          location,
        );

        // Generate PDF blob
        const pdfBlob = await generateCertificatePDFBlob(
          certificateData,
          "public_inspector", // Generic inspector ID for public certificates
          "public_approver", // Generic approver ID for public certificates
        );

        // Create blob URL
        const blobUrl = URL.createObjectURL(pdfBlob);
        newBlobUrls[cert.certificateNumber] = blobUrl;
      } catch (error) {
        console.error(
          `Failed to generate PDF for certificate ${cert.certificateNumber}:`,
          error,
        );
        // Continue with other certificates
      } finally {
        newGeneratingState[cert.certificateNumber] = false;
      }
    }

    setPdfBlobUrls(newBlobUrls);
    setGeneratingPdf(newGeneratingState);
  };

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      Object.values(pdfBlobUrls).forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [pdfBlobUrls]);

  const handlePrevious = () => {
    if (currentCertificateIndex > 0) {
      setCurrentCertificateIndex(currentCertificateIndex - 1);
    }
  };

  const handleNext = () => {
    if (data && currentCertificateIndex < data.certificates.length - 1) {
      setCurrentCertificateIndex(currentCertificateIndex + 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        handlePrevious();
      } else if (event.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentCertificateIndex, data]);

  // Reset to first certificate when data changes
  useEffect(() => {
    if (data && data.certificates.length > 0) {
      setCurrentCertificateIndex(0);
    }
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="mb-6 rounded-lg bg-white p-6 shadow">
              <div className="mb-4 h-8 w-1/2 rounded bg-gray-200"></div>
              <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
              <div className="h-4 w-1/2 rounded bg-gray-200"></div>
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-lg bg-white p-6 shadow">
                  <div className="mb-4 h-6 w-1/3 rounded bg-gray-200"></div>
                  <div className="mb-2 h-4 w-1/2 rounded bg-gray-200"></div>
                  <div className="h-4 w-2/3 rounded bg-gray-200"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-20 min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              Error Loading Certificates
            </h3>
            <p className="mb-4 text-gray-600">{error}</p>
            <button
              onClick={fetchCertificates}
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { certificates, productInfo, totalCount } = data;

  return (
    <div className="mx-auto mt-15 max-w-c-1280 px-4 md:px-8 xl:mt-20 xl:px-0">
      <div className="mx-auto max-w-4xl px-2 sm:px-3 md:px-4 lg:px-6">
        {/* Compact Product Header */}
        <div className="mb-3 rounded-lg bg-white shadow-sm">
          <div className="px-3 py-2">
            <div className="flex items-start">
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-lg font-bold text-gray-900">
                  {productInfo.productName}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-gray-600">
                  <span className="inline-flex items-center rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-800">
                    #{productInfo.productNumber}
                  </span>
                  <span className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-800">
                    {productInfo.productType}
                  </span>
                  <span className="inline-flex items-center rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800">
                    {productInfo.brand}
                  </span>
                  {productInfo.currentLocation && (
                    <span className="inline-flex items-center rounded bg-purple-100 px-1.5 py-0.5 text-xs text-purple-800">
                      <svg
                        className="mr-1 h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {productInfo.currentLocation}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Simple certificate counter */}
            {certificates.length > 0 && (
              <div className="mt-2 border-t border-gray-100 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {totalCount} certificate{totalCount !== 1 ? "s" : ""} available
                  </span>
                  {certificates.length > 1 && (
                    <span className="text-xs text-gray-500 font-medium">
                      {currentCertificateIndex + 1} / {certificates.length}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Certificate Content */}
        {certificates.length === 0 ? (
          <div className="rounded-lg bg-white p-6 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="mb-1 text-base font-medium text-gray-900">
              No Certificates Available
            </h3>
            <p className="text-sm text-gray-600">
              This product has not completed any approved inspections yet.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="rounded-lg bg-white shadow-sm">
              <div
                className={`flex items-center justify-center ${
                  isMobile ? "px-3 py-2" : "px-3 py-1.5"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handlePrevious}
                    disabled={currentCertificateIndex === 0}
                    className={`inline-flex items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${
                      isMobile ? "h-8 w-8" : "h-6 w-6"
                    }`}
                  >
                    <svg
                      className={isMobile ? "h-5 w-5" : "h-3 w-3"}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <span
                    className={`text-gray-500 ${
                      isMobile ? "px-2 text-xs" : "mx-2 text-xs"
                    }`}
                  >
                    {currentCertificateIndex + 1} / {certificates.length}
                  </span>
                  <button
                    onClick={handleNext}
                    disabled={
                      currentCertificateIndex === certificates.length - 1
                    }
                    className={`inline-flex items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${
                      isMobile ? "h-8 w-8" : "h-6 w-6"
                    }`}
                  >
                    <svg
                      className={isMobile ? "h-5 w-5" : "h-3 w-3"}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Certificate Preview */}
            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
              {(() => {
                const currentCert = certificates[currentCertificateIndex];
                const blobUrl = pdfBlobUrls[currentCert.certificateNumber];
                const isGenerating =
                  generatingPdf[currentCert.certificateNumber];

                if (isGenerating) {
                  return (
                    <div
                      className={`flex items-center justify-center ${
                        isMobile ? "h-[350px]" : "h-[450px] sm:h-[650px]"
                      }`}
                    >
                      <div className="text-center">
                        <svg
                          className="mx-auto h-8 w-8 animate-spin text-blue-600"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600">
                          Generating PDF preview...
                        </p>
                      </div>
                    </div>
                  );
                }

                // Mobile: Show complete certificate details with inspection data
                if (isMobile) {
                  return (
                    <MobileInspectionView
                      certificate={currentCert}
                      downloadUrl={blobUrl || currentCert.downloadUrl}
                    />
                  );
                }

                // Desktop: Show iframe preview
                return (
                  <iframe
                    src={blobUrl || currentCert.downloadUrl}
                    className="h-[70vh] min-h-[500px] w-full border-0"
                    title={`Certificate ${currentCert.certificateNumber} Preview`}
                  />
                );
              })()}
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500">
            Official fire safety inspection certificates
          </p>
        </div>
      </div>
    </div>
  );
}
