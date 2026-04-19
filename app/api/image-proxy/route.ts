import { NextRequest, NextResponse } from "next/server";

/**
 * Proxies Firebase Storage image URLs to bypass CORS restrictions.
 * Only allows firebasestorage.googleapis.com URLs for security.
 *
 * Usage: /api/image-proxy?url=<encoded-firebase-storage-url>
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Security: only allow Firebase Storage URLs
  if (!url.startsWith("https://firebasestorage.googleapis.com/")) {
    return NextResponse.json({ error: "Only Firebase Storage URLs are allowed" }, { status: 403 });
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Proxy fetch failed" }, { status: 500 });
  }
}
