import QRCode from "qrcode";
import { ProductQRData } from "./qrCodeGenerator";

/**
 * Configuration options for designed QR code generation
 */
export interface QRDesignOptions {
  size: number;
  margin: number;
  backgroundColor: string;
  textColor: string;
  qrColor: string;
  borderRadius: number;
  fontFamily: string;
  showBorder: boolean;
  borderColor: string;
  embeddedLogoSize: number;
  headerTextSpacing: number;
  footerTextSpacing: number;
}

/**
 * Ultra-compact design options for minimal footprint
 */
const ULTRA_COMPACT_OPTIONS: QRDesignOptions = {
  size: 280,
  margin: 8,
  backgroundColor: "#ffffff",
  textColor: "#1a1a1a",
  qrColor: "#000000",
  borderRadius: 4,
  fontFamily: "Arial, sans-serif",
  showBorder: false,
  borderColor: "#e5e7eb",
  embeddedLogoSize: 40,
  headerTextSpacing: 35,
  footerTextSpacing: 25,
};

/**
 * Generates an ultra-compact, stable QR code with minimal flickering
 */
export async function generateDesignedQRCode(
  qrData: ProductQRData,
  logoUrl: string = "/images/logo/logo-light.png",
  options: Partial<QRDesignOptions> = {}
): Promise<HTMLCanvasElement> {
  const finalOptions = { ...ULTRA_COMPACT_OPTIONS, ...options };
  return generateStableCompactQR(qrData, logoUrl, finalOptions);
}

/**
 * Generate ultra-compact QR code with stable rendering
 */
async function generateStableCompactQR(
  qrData: ProductQRData,
  logoUrl: string,
  options: QRDesignOptions
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  // Ultra-compact fixed dimensions - no dynamic calculation to prevent flickering
  const qrSize = options.size;
  const canvasWidth = qrSize + (options.margin * 2);
  const canvasHeight = 380; // Fixed compact height
  
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  try {
    // Simple white background - no gradients to reduce complexity
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ultra-compact layout rendering
    await renderUltraCompactLayout(ctx, qrData, logoUrl, options, qrSize);

  } catch (error) {
    console.error("Error generating stable QR code:", error);
    // Simple error display
    ctx.fillStyle = "#ef4444";
    ctx.font = `12px ${options.fontFamily}`;
    ctx.textAlign = "center";
    ctx.fillText("QR Generation Error", canvas.width / 2, canvas.height / 2);
  }

  return canvas;
}

/**
 * Render ultra-compact layout in single pass
 */
async function renderUltraCompactLayout(
  ctx: CanvasRenderingContext2D,
  qrData: ProductQRData,
  logoUrl: string,
  options: QRDesignOptions,
  qrSize: number
): Promise<void> {
  const centerX = ctx.canvas.width / 2;
  let y = options.margin + 10;
  
  ctx.textAlign = "center";
  
  // 1. Company name - minimal
  ctx.fillStyle = "#374151";
  ctx.font = `bold 9px ${options.fontFamily}`;
  ctx.fillText("PT BRILIAN EKA SAETAMA", centerX, y);
  y += 15;

  // 2. Product name - compact, truncated if needed
  ctx.fillStyle = options.textColor;
  ctx.font = "bold 11px " + options.fontFamily;
  const productName = qrData.productName.length > 35 
    ? qrData.productName.substring(0, 32) + "..." 
    : qrData.productName;
  ctx.fillText(productName.toUpperCase(), centerX, y);
  y += 15;

  // 3. Product info - single compact line
  ctx.fillStyle = "#6b7280";
  ctx.font = "9px " + options.fontFamily;
  let infoText = qrData.productNumber;
  if (qrData.customerName && qrData.customerName.length < 20) {
    infoText += " • " + qrData.customerName;
  }
  ctx.fillText(infoText, centerX, y);
  y += 20;

  // 4. QR Code - positioned for optimal compactness
  const qrX = options.margin;
  const qrY = y;
  
  // Generate and draw QR code
  const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
    width: qrSize,
    margin: 0,
    color: { dark: options.qrColor, light: "#ffffff" },
    errorCorrectionLevel: "H",
  });
  
  const qrImage = await loadImage(qrDataUrl);
  ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

  // 5. Embedded logo - simple and small
  try {
    const logoImage = await loadImage(logoUrl);
    const logoSize = options.embeddedLogoSize;
    const logoX = qrX + (qrSize - logoSize) / 2;
    const logoY = qrY + (qrSize - logoSize) / 2;
    
    // Simple white circle background
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 3, 0, 2 * Math.PI);
    ctx.fill();
    
    // Minimal border
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 2, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Draw logo
    ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
    
  } catch (logoError) {
    console.warn("Logo load failed:", logoError);
  }

  // 6. Footer - minimal
  const footerY = qrY + qrSize + 15;
  
  // Location (if exists and not too long)
  if (qrData.location && qrData.location !== "N/A" && qrData.location.length < 25) {
    ctx.fillStyle = "#9ca3af";
    ctx.font = "8px " + options.fontFamily;
    ctx.fillText("📍 " + qrData.location, centerX, footerY);
  }
  
  // Timestamp - very small
  ctx.fillStyle = "#d1d5db";
  ctx.font = "7px " + options.fontFamily;
  const timestamp = new Date().toLocaleDateString('id-ID');
  ctx.fillText("Generated: " + timestamp, centerX, footerY + 12);
}

/**
 * Helper function to load image with error handling
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    const timeout = setTimeout(() => {
      reject(new Error("Image load timeout"));
    }, 3000);
    
    img.onload = () => {
      clearTimeout(timeout);
      resolve(img);
    };
    
    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error(`Failed to load: ${src}`));
    };
    
    img.src = src;
  });
}

/**
 * Generate QR blob with error handling
 */
export async function generateDesignedQRBlob(
  qrData: ProductQRData,
  logoUrl?: string,
  options?: Partial<QRDesignOptions>,
  format: "png" | "jpeg" = "png",
  quality: number = 0.9
): Promise<Blob> {
  try {
    const canvas = await generateDesignedQRCode(qrData, logoUrl, options);
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Blob generation timeout"));
      }, 5000);
      
      canvas.toBlob(
        (blob) => {
          clearTimeout(timeoutId);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to generate blob"));
          }
        },
        format === "jpeg" ? "image/jpeg" : "image/png",
        quality
      );
    });
  } catch (error) {
    throw new Error(`QR blob generation failed: ${error}`);
  }
}

/**
 * Generate QR data URL with error handling
 */
export async function generateDesignedQRDataURL(
  qrData: ProductQRData,
  logoUrl?: string,
  options?: Partial<QRDesignOptions>,
  format: "png" | "jpeg" = "png",
  quality: number = 0.9
): Promise<string> {
  try {
    const canvas = await generateDesignedQRCode(qrData, logoUrl, options);
    return canvas.toDataURL(
      format === "jpeg" ? "image/jpeg" : "image/png",
      quality
    );
  } catch (error) {
    throw new Error(`QR data URL generation failed: ${error}`);
  }
}

/**
 * Download QR code with error handling
 */
export async function downloadDesignedQRCode(
  qrData: ProductQRData,
  logoUrl?: string,
  options?: Partial<QRDesignOptions>,
  filename?: string
): Promise<void> {
  try {
    const blob = await generateDesignedQRBlob(qrData, logoUrl, options);
    
    const safeProductNumber = qrData.productNumber.replace(/[^a-zA-Z0-9]/g, "_");
    const safeProductName = qrData.productName.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 15);
    const defaultFilename = `QR_${safeProductNumber}_${safeProductName}`;
    const finalFilename = filename || defaultFilename;
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${finalFilename}.png`;
    link.style.display = "none";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Download failed:", error);
    throw error;
  }
}

/**
 * Get optimized options for different use cases
 */
export function getQRDesignOptions(
  usage: "mobile" | "print" | "web" | "large_print"
): Partial<QRDesignOptions> {
  const baseOptions = {
    margin: 8,
    backgroundColor: "#ffffff",
    textColor: "#1a1a1a",
    qrColor: "#000000",
    fontFamily: "Arial, sans-serif",
    showBorder: false,
    borderColor: "#e5e7eb",
  };

  switch (usage) {
    case "mobile":
      return {
        ...baseOptions,
        size: 240,
        embeddedLogoSize: 32,
        headerTextSpacing: 30,
        footerTextSpacing: 20,
      };
    case "web":
      return {
        ...baseOptions,
        size: 260,
        embeddedLogoSize: 36,
        headerTextSpacing: 32,
        footerTextSpacing: 22,
      };
    case "print":
      return {
        ...baseOptions,
        size: 280,
        embeddedLogoSize: 40,
        headerTextSpacing: 35,
        footerTextSpacing: 25,
      };
    case "large_print":
      return {
        ...baseOptions,
        size: 320,
        embeddedLogoSize: 48,
        headerTextSpacing: 40,
        footerTextSpacing: 30,
      };
    default:
      return {
        ...baseOptions,
        size: 280,
        embeddedLogoSize: 40,
        headerTextSpacing: 35,
        footerTextSpacing: 25,
      };
  }
}