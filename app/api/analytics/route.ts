import { NextResponse } from "next/server";
import { getOverviewData } from "@/services/analyticsService";

export async function GET(request: Request) {
  try {
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
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
