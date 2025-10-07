"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ProductQRData, generateProductQRData } from "@/utils/qrCodeGenerator";
import {
  generateDesignedQRCode,
  QRDesignOptions,
  getQRDesignOptions,
} from "@/utils/qrCodeDesigner";

interface QRCodeWithDesignProps {
  qrData: ProductQRData;
  size?: "mobile" | "print" | "web" | "large_print";
  logoUrl?: string;
  customOptions?: Partial<QRDesignOptions>;
  className?: string;
  onGenerated?: (canvas: HTMLCanvasElement) => void;
  onError?: (error: Error) => void;
}

/**
 * QRCodeWithDesign Component
 * Renders an aesthetic QR code with company logo and product information
 * Fixed to prevent infinite loops and flickering
 */
export default function QRCodeWithDesign({
  qrData,
  size = "web",
  logoUrl = "/images/logo/logo-light.png",
  customOptions = {},
  className = "",
  onGenerated,
  onError,
}: QRCodeWithDesignProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isGeneratingRef = useRef(false);
  const lastGeneratedRef = useRef<string>("");

  // Memoize the QR generation function
  const generateQRDesign = useCallback(async () => {
    // Prevent concurrent generations
    if (isGeneratingRef.current || !canvasRef.current) return;

    // Create a stable key for this generation
    const generationKey = JSON.stringify({
      qrData,
      size,
      logoUrl,
      customOptions,
    });

    // Skip if we already generated for these exact parameters
    if (lastGeneratedRef.current === generationKey) {
      return;
    }

    isGeneratingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // Get optimized options for the specified size
      const sizeOptions = getQRDesignOptions(size);
      const finalOptions = { ...sizeOptions, ...customOptions };

      // Generate QR URL for the designed QR code content
      const qrUrl = generateProductQRData(
        {
          productNumber: parseInt(qrData.productNumber),
          name: qrData.productName,
          productType: qrData.productType,
          specs: { brand: qrData.brand, serialNumber: qrData.serialNumber },
          maintenanceInterval: qrData.maintenanceInterval
        } as any,
        qrData.productId
      );

      // Generate the designed QR code with URL content and ProductQRData for labels
      const designedCanvas = await generateDesignedQRCode(
        qrUrl,
        qrData,
        logoUrl,
        finalOptions,
      );

      // Copy to our canvas
      const canvas = canvasRef.current;
      if (!canvas) return; // Component might have unmounted

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = designedCanvas.width;
      canvas.height = designedCanvas.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(designedCanvas, 0, 0);

      // Update the last generated key
      lastGeneratedRef.current = generationKey;

      // Notify parent component only once
      if (onGenerated) {
        onGenerated(designedCanvas);
      }

      setIsLoading(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate QR code";
      setError(errorMessage);
      setIsLoading(false);

      if (onError) {
        onError(new Error(errorMessage));
      }

      console.error("QR code generation error:", err);
    } finally {
      isGeneratingRef.current = false;
    }
  }, [qrData, size, logoUrl, customOptions, onGenerated, onError]);

  // Use effect with stable dependencies
  useEffect(() => {
    generateQRDesign();
  }, [generateQRDesign]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isGeneratingRef.current = false;
      lastGeneratedRef.current = "";
    };
  }, []);

  if (error) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-red-300 bg-red-50 p-6 ${className}`}
      >
        <div className="text-center text-red-600">
          <svg
            className="mx-auto mb-3 h-12 w-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h3 className="mb-1 text-sm font-medium">
            QR Code Generation Failed
          </h3>
          <p className="text-xs text-red-500">{error}</p>
        </div>
        <button
          onClick={() => {
            lastGeneratedRef.current = ""; // Reset to force regeneration
            generateQRDesign();
          }}
          className="mt-3 rounded bg-red-600 px-3 py-1 text-xs text-white transition-colors hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      className={`relative 
    `}
    >
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white bg-opacity-75">
          <div className="flex flex-col items-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="mt-2 text-sm text-gray-600">Generating QR Code...</p>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className={`m-0 h-auto max-w-full p-0
           ${isLoading ? "opacity-50" : "opacity-100"}`}
        style={{
          transition: "opacity 0.3s ease",
        }}
      />
    </div>
  );
}

/**
 * QRCodeWithDesignPreview Component
 * Lighter version for preview purposes with minimal styling
 */
interface QRCodeWithDesignPreviewProps
  extends Omit<QRCodeWithDesignProps, "onGenerated" | "onError"> {
  showInfo?: boolean;
}

export function QRCodeWithDesignPreview({
  qrData,
  size = "mobile",
  logoUrl = "/images/logo/logo-light.png",
  customOptions = {},
  className = "",
  showInfo = true,
}: QRCodeWithDesignPreviewProps) {
  return (
    <div className={`rounded-lg bg-white p-4 ${className}`}>
      <QRCodeWithDesign
        qrData={qrData}
        size={size}
        logoUrl={logoUrl}
        customOptions={customOptions}
        className="mx-auto"
      />

      {showInfo && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          <div className="space-y-1 text-sm">
            <div className="truncate font-medium text-gray-900">
              {qrData.productName}
            </div>
            <div className="text-gray-600">{qrData.productNumber}</div>
            {qrData.customerName && (
              <div className="text-xs text-gray-500">
                Customer: {qrData.customerName}
              </div>
            )}
            {qrData.location && qrData.location !== "N/A" && (
              <div className="text-xs text-gray-500">
                Location: {qrData.location}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
