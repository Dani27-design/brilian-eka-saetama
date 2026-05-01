"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MobileInspectionView } from "./MobileInspectionView";
import { useLanguage } from "@/app/context/LanguageContext";
import PromoSection from "@/components/Site/PromoSection";

// Export the interface for other components
export type { PublicCertificateData };

const translations = {
  id: {
    certificatesAvailable: "sertifikat tersedia",
    noCertificates: "Belum Ada Sertifikat",
    noCertificatesDesc: "Produk ini belum memiliki inspeksi yang disetujui.",
    errorLoading: "Gagal Memuat Sertifikat",
    tryAgain: "Coba Lagi",
    generatingPdf: "Menyiapkan pratinjau PDF...",
  },
  en: {
    certificatesAvailable: "certificates available",
    noCertificates: "No Certificates Available",
    noCertificatesDesc: "This product has not completed any approved inspections yet.",
    errorLoading: "Error Loading Certificates",
    tryAgain: "Try Again",
    generatingPdf: "Generating PDF preview...",
  },
};

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
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.id;
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
  const pdfBlobUrlsRef = useRef<{ [certificateNumber: string]: string }>({});

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // On-demand PDF generation: generates PDF for a single certificate when needed
  const generatePdfForCertificate = useCallback(async (cert: PublicCertificateData) => {
    if (!cert.rawMaintenanceData || !cert.rawProductData) return;
    if (pdfBlobUrlsRef.current[cert.certificateNumber]) return; // Already cached

    try {
      setGeneratingPdf((prev) => ({ ...prev, [cert.certificateNumber]: true }));

      // Dynamic import — PDF libs (~400KB) only loaded when actually needed
      const { createCertificateData, generateCertificatePDFBlob } =
        await import("@/utils/pdfCertificate");

      const location =
        cert.resolvedLocation ||
        cert.rawContractData?.location ||
        cert.rawContractData?.customerData?.address ||
        cert.rawProductData?.location ||
        "N/A";

      const engineerNames = cert.resolvedEngineerNames ||
        cert.engineerNames || ["Inspector"];
      const approverName =
        cert.resolvedApproverName || "Certificate Authority";

      const certificateData = createCertificateData(
        cert.rawMaintenanceData,
        cert.rawContractData || {},
        cert.rawProductData,
        engineerNames,
        approverName,
        location,
      );

      const pdfBlob = await generateCertificatePDFBlob(
        certificateData,
        "public_inspector",
        "public_approver",
      );

      const blobUrl = URL.createObjectURL(pdfBlob);
      pdfBlobUrlsRef.current[cert.certificateNumber] = blobUrl;
      setPdfBlobUrls((prev) => ({ ...prev, [cert.certificateNumber]: blobUrl }));
    } catch (error) {
      console.error(
        `Failed to generate PDF for certificate ${cert.certificateNumber}:`,
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      setGeneratingPdf((prev) => ({ ...prev, [cert.certificateNumber]: false }));
    }
  }, []);

  // Trigger PDF generation for the current certificate (desktop only)
  useEffect(() => {
    if (data && !isMobile && data.certificates[currentCertificateIndex]) {
      generatePdfForCertificate(data.certificates[currentCertificateIndex]);
    }
  }, [currentCertificateIndex, data, isMobile, generatePdfForCertificate]);

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      Object.values(pdfBlobUrlsRef.current).forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  const handlePrevious = useCallback(() => {
    setCurrentCertificateIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    if (data) {
      setCurrentCertificateIndex((prev) =>
        Math.min(data.certificates.length - 1, prev + 1)
      );
    }
  }, [data]);

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
  }, [handlePrevious, handleNext]);

  // Reset to first certificate when data changes
  useEffect(() => {
    if (data && data.certificates.length > 0) {
      setCurrentCertificateIndex(0);
    }
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="mb-6 rounded-lg bg-white dark:bg-gray-800 p-6 shadow dark:shadow-gray-900/20">
              <div className="mb-4 h-8 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="mb-2 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow dark:shadow-gray-900/20">
                  <div className="mb-4 h-6 w-1/3 rounded bg-gray-200 dark:bg-gray-700"></div>
                  <div className="mb-2 h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
                  <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700"></div>
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
      <div className="mt-20 min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-white dark:bg-gray-800 p-8 text-center shadow dark:shadow-gray-900/20">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <svg
                className="h-6 w-6 text-red-600 dark:text-red-400"
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
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
              {t.errorLoading}
            </h3>
            <p className="mb-4 text-gray-600 dark:text-gray-300">{error}</p>
            <button
              onClick={fetchCertificates}
              className="inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {t.tryAgain}
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
    <div className="mx-auto mt-20 mb-16 max-w-c-1280 px-4 md:px-8 xl:mt-28 xl:mb-20 xl:px-0">
      <div className="mx-auto max-w-4xl px-2 sm:px-3 md:px-4 lg:px-6">
        {/* Product Header */}
        <div className="mb-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-gray-900/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">{productInfo.productName}</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {productInfo.productType} · {productInfo.brand} · #{productInfo.productNumber}
              </p>
            </div>
            {certificates.length > 0 && (
              <span className="rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-medium text-green-800 dark:text-green-300">
                {totalCount} {t.certificatesAvailable}
              </span>
            )}
          </div>
        </div>

        {/* Certificate Content */}
        {certificates.length === 0 ? (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-center shadow-sm dark:shadow-gray-900/20">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <svg
                className="h-5 w-5 text-gray-400 dark:text-gray-500"
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
            <h3 className="mb-1 text-base font-medium text-gray-900 dark:text-white">
              {t.noCertificates}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t.noCertificatesDesc}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Navigation - only when multiple certificates */}
            {certificates.length > 1 && (
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handlePrevious}
                  disabled={currentCertificateIndex === 0}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400">{currentCertificateIndex + 1} / {certificates.length}</span>
                <button
                  onClick={handleNext}
                  disabled={currentCertificateIndex === certificates.length - 1}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

            {/* Certificate Preview */}
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900/20">
              {(() => {
                const currentCert = certificates[currentCertificateIndex];
                const blobUrl = pdfBlobUrls[currentCert.certificateNumber];
                const isGenerating =
                  generatingPdf[currentCert.certificateNumber];

                if (isGenerating) {
                  return (
                    <div className="flex h-[450px] items-center justify-center md:h-[650px]">
                      <div className="text-center">
                        <svg
                          className="mx-auto h-8 w-8 animate-spin text-primary"
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
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                          {t.generatingPdf}
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

        {/* Promotion Section */}
        <PromoSection variant="services" className="mt-8" />
      </div>
    </div>
  );
}
