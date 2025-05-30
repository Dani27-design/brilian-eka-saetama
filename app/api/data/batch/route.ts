import { batchCreateData } from "@/actions/create";
import { NextResponse } from "next/server";

/**
 * Dynamic batch data creation endpoint for Firestore
 *
 * Expected request body format:
 * {
 *   "language": "en", // or "id" or any language code
 *   "collection": "about", // the main collection name
 *   "data": {
 *     "document_1": "String value", // for simple string values
 *     "document_2": {}, // for object values
 *     "document_3": [] // for array values
 *   }
 * }
 */
export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const { language, collection, data } = requestData;

    if (!language || !collection || !data || typeof data !== "object") {
      return NextResponse.json(
        {
          error:
            "Missing or invalid required fields. Expected: language, collection, and data object.",
        },
        { status: 400 },
      );
    }

    const result = await batchCreateData({ language, collection, data });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Operation failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 },
    );
  }
}
