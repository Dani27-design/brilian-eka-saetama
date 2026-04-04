import { NextRequest, NextResponse } from "next/server";
import { parseQRSignatureData } from "@/utils/qrSignatureGenerator";

/**
 * API endpoint for verifying QR code signatures
 * Accepts QR data and returns parsed signature information
 */
export async function POST(request: NextRequest) {
  try {
    const { qrData } = await request.json();
    
    if (!qrData) {
      return NextResponse.json(
        { error: "QR data is required" },
        { status: 400 }
      );
    }
    
    // Parse the QR signature data
    const signatureData = parseQRSignatureData(qrData);
    
    if (!signatureData) {
      return NextResponse.json(
        { error: "Invalid QR signature data" },
        { status: 400 }
      );
    }
    
    // Return verification results
    return NextResponse.json({
      success: true,
      signature: {
        type: signatureData.type,
        certificateNumber: signatureData.certNumber,
        signer: {
          name: signatureData.signer.name,
          role: signatureData.signer.role,
          id: signatureData.signer.id,
        },
        signedAt: signatureData.signedAt,
        inspection: {
          id: signatureData.inspectionId,
          date: signatureData.inspectionDate,
          productNumber: signatureData.productNumber,
          contractNumber: signatureData.contractNumber,
        }
      }
    });
    
  } catch (error: any) {
    console.error("Signature verification error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to verify signature" },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to provide information about signature verification
 */
export async function GET() {
  return NextResponse.json({
    message: "QR Signature Verification API",
    usage: "POST QR data to verify inspection signatures",
    fields: {
      qrData: "string - Raw QR code data to verify"
    },
    response: {
      success: "boolean",
      signature: {
        type: "string",
        certificateNumber: "string", 
        signer: {
          name: "string",
          role: "inspector|approver",
          id: "string"
        },
        signedAt: "string",
        inspection: {
          id: "string",
          date: "string",
          productNumber: "string",
          contractNumber: "string"
        }
      }
    }
  });
}