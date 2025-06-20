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
      dimensions: [{ name: "pagePath" }], // Tambahkan dimensi pagePath
      metrics: [
        { name: "screenPageViews" },
        { name: "totalUsers" },
        { name: "userEngagementDuration" },
        { name: "sessions" },
        { name: "bounceRate" },
      ],
      limit: 10000, // pastikan cukup besar untuk seluruh data
    });

    // Filter data yang bukan /admin
    const filteredRows = (response.rows || []).filter(
      (row) => !row.dimensionValues?.[0].value?.includes("/admin"),
    );

    // Agregasi manual
    let pageViews = 0;
    let visitors = new Set<string>();
    let totalEngagement = 0;
    let sessions = 0;
    let bounceSum = 0;
    let bounceCount = 0;

    filteredRows.forEach((row) => {
      pageViews += Number(row.metricValues?.[0].value || 0);
      // totalUsers tidak bisa di-union manual, jadi gunakan sum sebagai pendekatan
      visitors.add(row.metricValues?.[1].value || ""); // asumsikan userId, jika tidak, gunakan sum
      totalEngagement += Number(row.metricValues?.[2].value || 0);
      sessions += Number(row.metricValues?.[3].value || 0);
      // bounceRate adalah rata-rata, jadi kita rata-ratakan manual
      if (row.metricValues?.[4].value) {
        bounceSum += Number(row.metricValues[4].value);
        bounceCount++;
      }
    });

    // Hitung rata-rata waktu per sesi (dalam detik)
    let avgTimeOnSite = "0:00";
    if (sessions > 0) {
      const avgSeconds = totalEngagement / sessions;
      avgTimeOnSite = formatTime(avgSeconds);
    }

    // Hitung bounce rate rata-rata
    const bounceRate = bounceCount > 0 ? bounceSum / bounceCount : 0;

    return {
      pageViews: pageViews.toString(),
      visitors: visitors.size.toString(), // pendekatan, bisa juga sum totalUsers
      avgTimeOnSite,
      bounceRate: `${bounceRate.toFixed(1)}%`,
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
      dimensions: [{ name: "date" }, { name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }, { name: "totalUsers" }],
      limit: 10000,
    });

    // Filter out /admin
    const filteredRows = (response.rows || []).filter(
      (row) => !row.dimensionValues?.[1].value?.includes("/admin"),
    );

    // Aggregate by date
    const trafficMap: Record<string, { visitors: number; pageViews: number }> =
      {};
    filteredRows.forEach((row) => {
      const date = row.dimensionValues?.[0].value || "";
      const pageViews = Number(row.metricValues?.[0].value || 0);
      const visitors = Number(row.metricValues?.[1].value || 0);
      if (!trafficMap[date]) {
        trafficMap[date] = { visitors: 0, pageViews: 0 };
      }
      trafficMap[date].pageViews += pageViews;
      trafficMap[date].visitors += visitors;
    });

    return Object.entries(trafficMap).map(([date, data]) => ({
      date,
      visitors: data.visitors,
      pageViews: data.pageViews,
    }));
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
      limit: 10000,
    });

    return (response.rows || [])
      .map((row) => ({
        name: row.dimensionValues?.[0].value ?? "unknown",
        views: Number(row.metricValues?.[0].value ?? 0),
      }))
      .filter((row) => !row.name.includes("/admin"));
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
      dimensions: [{ name: "deviceCategory" }, { name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }],
      limit: 10000,
    });

    // Filter out /admin
    const filteredRows = (response.rows || []).filter(
      (row) => !row.dimensionValues?.[1].value?.includes("/admin"),
    );

    // Aggregate by deviceCategory
    const deviceMap: Record<string, number> = {};
    let total = 0;
    filteredRows.forEach((row) => {
      const device = row.dimensionValues?.[0].value || "unknown";
      const views = Number(row.metricValues?.[0].value || 0);
      deviceMap[device] = (deviceMap[device] || 0) + views;
      total += views;
    });

    return Object.entries(deviceMap).map(([name, value]) => ({
      name,
      value: total > 0 ? Math.round((value / total) * 100) : 0,
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
      dimensions: [{ name: "sessionSource" }, { name: "pagePath" }],
      metrics: [{ name: "sessions" }],
      limit: 10000,
    });

    // Filter out /admin
    const filteredRows = (response.rows || []).filter(
      (row) => !row.dimensionValues?.[1].value?.includes("/admin"),
    );

    // Aggregate by sessionSource
    const sourceMap: Record<string, number> = {};
    let total = 0;
    filteredRows.forEach((row) => {
      const source = row.dimensionValues?.[0].value || "unknown";
      const sessions = Number(row.metricValues?.[0].value || 0);
      sourceMap[source] = (sourceMap[source] || 0) + sessions;
      total += sessions;
    });

    return Object.entries(sourceMap).map(([name, value]) => ({
      name,
      value: total > 0 ? Math.round((value / total) * 100) : 0,
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
