import { NextResponse } from "next/server";
import { getSourcesData } from "@/services/analyticsService";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate") || "30daysAgo";
    const endDate = url.searchParams.get("endDate") || "today";

    const data = await getSourcesData(startDate, endDate);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Sources API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
