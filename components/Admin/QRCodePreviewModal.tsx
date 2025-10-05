"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { ProductQRData } from "@/utils/qrCodeGenerator";
import QRCodeWithDesign from "./QRCodeWithDesign";
import { downloadDesignedQRCode, getQRDesignOptions } from "@/utils/qrCodeDesigner";

interface QRCodePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrData: ProductQRData;
  logoUrl?: string;
}

/**
 * QRCodePreviewModal Component
 * Provides a modal interface for previewing and printing QR codes
 * Fixed to prevent infinite loops and optimize performance
 */
export default function QRCodePreviewModal({
  isOpen,
  onClose,
  qrData,
  logoUrl = "/images/logo/logo-light.png",
}: QRCodePreviewModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [generatedCanvas, setGeneratedCanvas] = useState<HTMLCanvasElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Memoize the canvas generated handler to prevent infinite loops
  const handleCanvasGenerated = useCallback((canvas: HTMLCanvasElement) => {
    // Only update if canvas is actually different
    if (generatedCanvas !== canvas) {
      setGeneratedCanvas(canvas);
    }
  }, [generatedCanvas]);

  // Memoize QR design options
  const qrDesignOptions = useMemo(() => {
    return getQRDesignOptions("print");
  }, []);

  // Memoize handlers
  const handlePrint = useCallback(() => {
    if (!generatedCanvas) {
      console.error("No canvas available for printing");
      return;
    }

    try {
      // Create a new window for printing
      const printWindow = window.open("", "_blank", "width=800,height=600");
      if (!printWindow) {
        alert("Please allow popups to enable printing");
        return;
      }

      // Convert canvas to data URL
      const dataUrl = generatedCanvas.toDataURL("image/png", 1.0);

      // Create print document
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>QR Code - ${qrData.productNumber}</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                font-family: Arial, sans-serif;
                text-align: center;
                background: white;
              }
              .qr-container {
                display: inline-block;
                max-width: 100%;
                margin: 0 auto;
              }
              .qr-image {
                max-width: 100%;
                height: auto;
              }
              .qr-info {
                margin-top: 20px;
                font-size: 14px;
                color: #333;
              }
              .qr-info h3 {
                margin: 0 0 10px 0;
                font-size: 18px;
                font-weight: bold;
              }
              .qr-info p {
                margin: 5px 0;
              }
              @media print {
                body { 
                  margin: 0; 
                  padding: 15px;
                }
                .qr-container {
                  page-break-inside: avoid;
                }
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <img src="${dataUrl}" alt="QR Code" class="qr-image" />
              <div class="qr-info">
                <h3>${qrData.productName}</h3>
                <p><strong>Product Number:</strong> ${qrData.productNumber}</p>
                ${qrData.customerName ? `<p><strong>Customer:</strong> ${qrData.customerName}</p>` : ''}
                ${qrData.location && qrData.location !== 'N/A' ? `<p><strong>Location:</strong> ${qrData.location}</p>` : ''}
                ${qrData.productType ? `<p><strong>Product Type:</strong> ${qrData.productType}</p>` : ''}
                ${qrData.brand && qrData.brand !== 'N/A' ? `<p><strong>Brand:</strong> ${qrData.brand}</p>` : ''}
              </div>
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.onafterprint = function() {
                    window.close();
                  };
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();

    } catch (error) {
      console.error("Print error:", error);
      alert("Printing failed. Please try downloading instead.");
    }
  }, [generatedCanvas, qrData]);

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    try {
      await downloadDesignedQRCode(
        qrData,
        logoUrl,
        qrDesignOptions,
        `QR_${qrData.productNumber.replace(/[^a-zA-Z0-9]/g, "_")}_${qrData.productName.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 15)}`
      );
    } catch (error) {
      console.error("Download error:", error);
      alert("Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }, [qrData, logoUrl, qrDesignOptions]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">QR Code Preview</h2>
            <p className="text-sm text-gray-600 mt-1">{qrData.productName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* QR Code Preview */}
          <div className="mb-8 flex justify-center">
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 shadow-sm">
              <QRCodeWithDesign
                qrData={qrData}
                size="print"
                logoUrl={logoUrl}
                onGenerated={handleCanvasGenerated}
                className="mx-auto"
              />
            </div>
          </div>

          {/* Product Information */}
          <div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4 text-base">Product Information</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Product Number:</span>
                <span className="ml-2 font-medium">{qrData.productNumber}</span>
              </div>
              <div>
                <span className="text-gray-600">Product Type:</span>
                <span className="ml-2 font-medium">{qrData.productType}</span>
              </div>
              {qrData.brand && qrData.brand !== "N/A" && (
                <div>
                  <span className="text-gray-600">Brand:</span>
                  <span className="ml-2 font-medium">{qrData.brand}</span>
                </div>
              )}
              {qrData.customerName && (
                <div>
                  <span className="text-gray-600">Customer:</span>
                  <span className="ml-2 font-medium">{qrData.customerName}</span>
                </div>
              )}
              {qrData.location && qrData.location !== "N/A" && (
                <div className="lg:col-span-2">
                  <span className="text-gray-600">Location:</span>
                  <span className="ml-2 font-medium">{qrData.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row gap-3 px-6 py-5 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 sm:flex-none px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          
          <div className="flex gap-3 flex-1 sm:flex-none">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isDownloading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Downloading...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </>
              )}
            </button>
            
            <button
              onClick={handlePrint}
              disabled={!generatedCanvas}
              className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}