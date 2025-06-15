import { NextResponse } from "next/server";
import { getTopPagesData } from "@/services/analyticsService";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate") || "30daysAgo";
    const endDate = url.searchParams.get("endDate") || "today";

    const data = await getTopPagesData(startDate, endDate);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Pages API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
