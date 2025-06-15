import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { adminFirestore } from "@/db/firebase/firebaseAdmin";
import { google } from "googleapis";

// Get this from your Google Analytics 4 property settings
const PROPERTY_ID = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;

let analyticsDataClient: BetaAnalyticsDataClient | null = null;

// Initialize the Analytics Data client
async function getAnalyticsClient() {
  if (analyticsDataClient) return analyticsDataClient;

  try {
    // Use service account credentials from Firebase Admin
    analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: JSON.parse(
        Buffer.from(
          process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "",
          "base64",
        ).toString(),
      ),
    });

    return analyticsDataClient;
  } catch (error) {
    console.error("Failed to initialize Analytics Data client:", error);
    return null;
  }
}

// Get overview analytics data
export async function getOverviewData(startDate: string, endDate: string) {
  const client = await getAnalyticsClient();
  if (!client) return null;

  try {
    const [response] = await client.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: "screenPageViews" },
        { name: "totalUsers" },
        { name: "userEngagementDuration" },
        { name: "bounceRate" },
      ],
    });

    // Process response
    const metrics = response.rows?.[0]?.metricValues || [];
    return {
      pageViews: metrics[0]?.value || "0",
      visitors: metrics[1]?.value || "0",
      avgTimeOnSite: formatTime(Number(metrics[2]?.value || "0")),
      bounceRate: `${Math.round(Number(metrics[3]?.value || "0"))}%`,
    };
  } catch (error) {
    console.error("Error fetching overview data:", error);
    return null;
  }
}

// Get traffic data over time
export async function getTrafficData(startDate: string, endDate: string) {
  const client = await getAnalyticsClient();
  if (!client) return [];

  try {
    const [response] = await client.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "totalUsers" }, { name: "screenPageViews" }],
    });

    return (response.rows || []).map((row) => {
      const rawDate = row.dimensionValues?.[0].value || "";

      // Ensure date is in YYYY-MM-DD format
      let formattedDate = rawDate;

      // If in YYYYMMDD format, convert to YYYY-MM-DD
      if (/^\d{8}$/.test(rawDate)) {
        formattedDate = `${rawDate.substring(0, 4)}-${rawDate.substring(
          4,
          6,
        )}-${rawDate.substring(6, 8)}`;
      }

      return {
        date: formattedDate,
        visitors: Number(row.metricValues?.[0].value || 0),
        pageViews: Number(row.metricValues?.[1].value || 0),
      };
    });
  } catch (error) {
    console.error("Error fetching traffic data:", error);
    return [];
  }
}

// Get top pages data
export async function getTopPagesData(startDate: string, endDate: string) {
  const client = await getAnalyticsClient();
  if (!client) return [];

  try {
    const [response] = await client.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 10,
    });

    return (response.rows || []).map((row) => ({
      name: row.dimensionValues?.[0].value || "",
      views: Number(row.metricValues?.[0].value || 0),
    }));
  } catch (error) {
    console.error("Error fetching top pages data:", error);
    return [];
  }
}

// Get device category breakdown
export async function getDevicesData(startDate: string, endDate: string) {
  const client = await getAnalyticsClient();
  if (!client) return [];

  try {
    const [response] = await client.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "deviceCategory" }],
      metrics: [{ name: "totalUsers" }],
    });

    const total = (response.rows || []).reduce(
      (sum, row) => sum + Number(row.metricValues?.[0].value || 0),
      0,
    );

    return (response.rows || []).map((row) => ({
      name: row.dimensionValues?.[0].value || "",
      value: Math.round(
        (Number(row.metricValues?.[0].value || 0) / total) * 100,
      ),
    }));
  } catch (error) {
    console.error("Error fetching devices data:", error);
    return [];
  }
}

// Get traffic sources
export async function getSourcesData(startDate: string, endDate: string) {
  const client = await getAnalyticsClient();
  if (!client) return [];

  try {
    const [response] = await client.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "sessionSource" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10,
    });

    const total = (response.rows || []).reduce(
      (sum, row) => sum + Number(row.metricValues?.[0].value || 0),
      0,
    );

    return (response.rows || []).map((row) => ({
      name: row.dimensionValues?.[0].value || "(direct)",
      value: Math.round(
        (Number(row.metricValues?.[0].value || 0) / total) * 100,
      ),
    }));
  } catch (error) {
    console.error("Error fetching sources data:", error);
    return [];
  }
}

// Helper to format time in MM:SS format
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
