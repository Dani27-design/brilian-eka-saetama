import { NextRequest, NextResponse } from "next/server";
import { getOverviewData } from "@/services/analyticsService";
import { verifyAdminAuth } from "@/utils/auth";

export async function GET(request: NextRequest) {
  try {
    const authError = await verifyAdminAuth(request);
    if (authError) {
      return authError;
    }

    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate") || "30daysAgo";
    const endDate = url.searchParams.get("endDate") || "today";

    const data = await getOverviewData(startDate, endDate);

    if (!data) {
      return NextResponse.json(
        { error: "Failed to fetch analytics data" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Analytics API error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
