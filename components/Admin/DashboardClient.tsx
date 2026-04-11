"use client";

import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "@/db/firebase/firebaseConfig";
import { useRouter } from "next/navigation";
import {
  initializeAnalytics,
  getAnalytics,
} from "@/db/firebase/firebaseAnalytics";
import { logEvent } from "firebase/analytics";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useLanguage } from "@/app/context/LanguageContext";
import { usePageHeader } from "@/app/context/PageHeaderContext";

// Define translations
const translations = {
  id: {
    analyticsTitle: "Statistik Kinerja Website",
    analyticsSubtitle:
      "Lihat berapa banyak orang yang mengunjungi website Anda, halaman apa yang mereka lihat, dan bagaimana mereka menemukan situs Anda",
    errorTitle: "Gagal Memuat Data Statistik",
    errorRetry: "Silakan periksa koneksi internet Anda atau coba muat ulang halaman.",
    pageViews: "Halaman Dilihat",
    uniqueVisitors: "Total Pengunjung",
    avgTimeOnSite: "Waktu Kunjungan",
    minutesSeconds: "Rata-rata waktu pengunjung di situs Anda",
    bounceRate: "Pengunjung yang Langsung Pergi",
    siteAverage: "Persentase kunjungan satu halaman",
    trafficTrends: "Aktivitas Pengunjung dari Waktu ke Waktu",
    topPages: "Halaman Paling Sering Dikunjungi",
    deviceDistribution: "Perangkat yang Digunakan Pengunjung",
    trafficSources: "Asal Pengunjung Menemukan Situs Anda",
    last30Days: "Berdasarkan 30 hari terakhir",
    noDataAvailable: "Belum ada data — periksa kembali setelah situs Anda mendapat pengunjung",
    date: "Tanggal",
    loading: "Memuat...",
    visitors: "Pengunjung",
    views: "Tampilan",
    unknown: "Tanggal tidak diketahui",
  },
  en: {
    analyticsTitle: "Website Performance Dashboard",
    analyticsSubtitle:
      "See how many people visit your website, which pages they view, and how they found you",
    errorTitle: "Unable to Load Statistics Data",
    errorRetry: "Please check your internet connection or try refreshing the page.",
    pageViews: "Pages Viewed",
    uniqueVisitors: "Total Visitors",
    avgTimeOnSite: "Time Spent on Site",
    minutesSeconds: "How long visitors stay on average",
    bounceRate: "Left Without Exploring",
    siteAverage: "Percentage of single-page visits",
    trafficTrends: "Visitor Activity Over Time",
    topPages: "Most Visited Pages",
    deviceDistribution: "Devices Used by Visitors",
    trafficSources: "How Visitors Found Your Site",
    last30Days: "Based on the last 30 days",
    noDataAvailable: "No data available yet — check back once your site gets visitors",
    date: "Date",
    loading: "Loading...",
    visitors: "Visitors",
    views: "Views",
    unknown: "Unknown date",
  },
};

export default function AdminDashboard() {
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { language } = useLanguage(); // Get current language
  const t =
    translations[language as keyof typeof translations] || translations.en;

  usePageHeader(t.analyticsTitle, t.analyticsSubtitle);

  // Analytics data states
  const [overviewData, setOverviewData] = useState({
    pageViews: "0",
    visitors: "0",
    avgTimeOnSite: "0:00",
    bounceRate: "0%",
  });

  const [trafficData, setTrafficData] = useState<
    { date: string; visitors: number; pageViews: number }[]
  >([]);
  const [pageViewsData, setPageViewsData] = useState<
    { name: string; views: number }[]
  >([]);
  const [deviceData, setDeviceData] = useState<
    { name: string; value: number }[]
  >([]);
  const [sourceData, setSourceData] = useState<
    { name: string; value: number }[]
  >([]);

  // Custom colors
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  // Initialize Firebase Analytics
  useEffect(() => {
    const setupAnalytics = async () => {
      const analytics = await initializeAnalytics();

      if (analytics) {
        // Use the firebaseAnalytics module's logEvent
        logEvent(analytics, "admin_dashboard_view", {
          timestamp: new Date().toISOString(),
          user_role: "admin",
        });
        console.log("Analytics event logged successfully");
      } else {
        console.warn("Failed to initialize analytics");
      }
    };

    setupAnalytics();
  }, []);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setIsLoadingAnalytics(true);
      setError(null);

      try {
        // Get auth token for analytics API calls
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          throw new Error("Authentication required. Please sign in again.");
        }

        const authHeaders = {
          "Authorization": `Bearer ${token}`,
        };

        // Get date 30 days ago for analytics period (changed from 6 months)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const startDate = thirtyDaysAgo.toISOString().split("T")[0];
        const endDate = new Date().toISOString().split("T")[0];

        // Fetch overview data with date range and language
        const overviewResponse = await fetch(
          `/api/analytics?startDate=${startDate}&endDate=${endDate}&lang=${language}`,
          { headers: authHeaders },
        );
        if (!overviewResponse.ok) {
          throw new Error(`Overview API failed: ${overviewResponse.status}`);
        }
        const overviewResult = await overviewResponse.json();
        setOverviewData(overviewResult);

        // Fetch traffic trend data for 30 days
        const trafficResponse = await fetch(
          `/api/analytics/traffic?startDate=${startDate}&endDate=${endDate}&lang=${language}`,
          { headers: authHeaders },
        );
        if (!trafficResponse.ok) {
          throw new Error(`Traffic API failed: ${trafficResponse.status}`);
        }
        const trafficResult = await trafficResponse.json();
        setTrafficData(trafficResult);

        // Fetch top pages data for 30 days
        const pagesResponse = await fetch(
          `/api/analytics/pages?startDate=${startDate}&endDate=${endDate}&lang=${language}`,
          { headers: authHeaders },
        );
        if (!pagesResponse.ok) {
          throw new Error(`Pages API failed: ${pagesResponse.status}`);
        }
        const pagesResult = await pagesResponse.json();
        setPageViewsData(pagesResult);

        // Fetch device breakdown data for 30 days
        const deviceResponse = await fetch(
          `/api/analytics/devices?startDate=${startDate}&endDate=${endDate}&lang=${language}`,
          { headers: authHeaders },
        );
        if (!deviceResponse.ok) {
          throw new Error(`Devices API failed: ${deviceResponse.status}`);
        }
        const deviceResult = await deviceResponse.json();
        setDeviceData(deviceResult);

        // Fetch traffic sources data for 30 days
        const sourcesResponse = await fetch(
          `/api/analytics/sources?startDate=${startDate}&endDate=${endDate}&lang=${language}`,
          { headers: authHeaders },
        );
        if (!sourcesResponse.ok) {
          throw new Error(`Sources API failed: ${sourcesResponse.status}`);
        }
        const sourcesResult = await sourcesResponse.json();
        setSourceData(sourcesResult);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to fetch analytics data",
        );
      } finally {
        setIsLoadingAnalytics(false);
      }
    };

    fetchAnalyticsData();
  }, [language]); // Re-fetch when language changes

  // Format the traffic data for display - adjust for daily display in 30 day period
  const formatTrafficData = () => {
    if (!trafficData.length) return [];

    // For 30 days, we can show daily data directly
    // Create a copy of the data to avoid modifying the original
    return [...trafficData].sort((a, b) => {
      // Safer date parsing
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);

      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime();
    });
  };

  // Update the formatDate function
  const formatDate = (dateStr: string) => {
    try {
      // Handle ISO date format (YYYY-MM-DD)
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString(
            language === "id" ? "id-ID" : "en-US",
            {
              month: "short",
              day: "numeric",
            },
          );
        }
      }

      // Handle YYYYMMDD format (common in analytics APIs)
      if (/^\d{8}$/.test(dateStr)) {
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        const date = new Date(`${year}-${month}-${day}`);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString(
            language === "id" ? "id-ID" : "en-US",
            {
              month: "short",
              day: "numeric",
            },
          );
        }
      }

      // Try standard Date parsing as fallback
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString(language === "id" ? "id-ID" : "en-US", {
          month: "short",
          day: "numeric",
        });
      }

      // Return the original string if date is invalid
      return dateStr;
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateStr; // Return the original string as fallback
    }
  };

  // Helper function to safely parse dates
  const parseDate = (dateStr: string): Date | null => {
    try {
      // Handle ISO format (YYYY-MM-DD)
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) return date;
      }

      // Handle YYYYMMDD format
      if (/^\d{8}$/.test(dateStr)) {
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        const date = new Date(`${year}-${month}-${day}`);
        if (!isNaN(date.getTime())) return date;
      }

      // Try standard Date parsing
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) return date;

      console.warn(`Invalid date format: ${dateStr}`);
      return null;
    } catch (error) {
      console.error("Error parsing date:", error);
      return null;
    }
  };

  // Prepare data for charts
  const displayData = formatTrafficData();

  return (
    <div>
      {/* Error display */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
          <p className="font-medium">{t.errorTitle}</p>
          <p>{error}</p>
          <p className="mt-2 text-sm">{t.errorRetry}</p>
        </div>
      )}

      {/* Overview Section */}
      <div className="mb-4">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-stroke bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {t.pageViews}
              </span>
            </div>
            <h3 className="mt-2 text-2xl font-bold text-black">
              {isLoadingAnalytics ? t.loading : overviewData.pageViews}
            </h3>
            <p className="mt-1 text-xs text-gray-500">{t.last30Days}</p>
          </div>

          <div className="rounded-lg border border-stroke bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {t.uniqueVisitors}
              </span>
            </div>
            <h3 className="mt-2 text-2xl font-bold text-black">
              {isLoadingAnalytics ? t.loading : overviewData.visitors}
            </h3>
            <p className="mt-1 text-xs text-gray-500">{t.last30Days}</p>
          </div>

          <div className="rounded-lg border border-stroke bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {t.avgTimeOnSite}
              </span>
            </div>
            <h3 className="mt-2 text-2xl font-bold text-black">
              {isLoadingAnalytics ? t.loading : overviewData.avgTimeOnSite}
            </h3>
            <p className="mt-1 text-xs text-gray-500">{t.minutesSeconds}</p>
          </div>

          <div className="rounded-lg border border-stroke bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {t.bounceRate}
              </span>
            </div>
            <h3 className="mt-2 text-2xl font-bold text-black">
              {isLoadingAnalytics ? t.loading : overviewData.bounceRate}
            </h3>
            <p className="mt-1 text-xs text-gray-500">{t.siteAverage}</p>
          </div>
        </div>
      </div>

      {/* Traffic Trends Chart */}
      <div className="mb-4 rounded-lg border border-stroke bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-black">
          {t.trafficTrends}
        </h2>
        <div className="h-80">
          {isLoadingAnalytics ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : displayData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={displayData}
                margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
              >
                <defs>
                  <linearGradient
                    id="colorPageViews"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient
                    id="colorVisitors"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const formatted = formatDate(value);
                    return formatted === value ? t.unknown : formatted;
                  }}
                  angle={-30}
                  textAnchor="end"
                  height={60}
                  minTickGap={15}
                  interval="preserveStartEnd"
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => `${t.date}: ${formatDate(value)}`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="pageViews"
                  name={t.pageViews}
                  stroke="#8884d8"
                  fillOpacity={1}
                  fill="url(#colorPageViews)"
                />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  name={t.visitors}
                  stroke="#82ca9d"
                  fillOpacity={1}
                  fill="url(#colorVisitors)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-500">{t.noDataAvailable}</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Pages */}
      <div className="mb-4 rounded-lg border border-stroke bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-black">
          {t.topPages}
        </h2>
        <div className="h-80">
          {isLoadingAnalytics ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : pageViewsData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={pageViewsData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 70, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0088FE" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#0088FE" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={50}
                  interval={0}
                  tick={({ x, y, payload }) => {
                    const maxLen = 18;
                    let label = payload.value;
                    if (label.length > maxLen) {
                      label = label.slice(0, maxLen - 3) + "...";
                    }
                    return (
                      <text
                        x={x}
                        y={y}
                        dy={4}
                        fontSize={12}
                        textAnchor="end"
                        className="text-gray-700"
                      >
                        {label}
                      </text>
                    );
                  }}
                />
                <Tooltip />
                <Bar
                  dataKey="views"
                  name={t.views}
                  fill="url(#colorBar)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-500">{t.noDataAvailable}</p>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Analytics Section - Device Distribution & Traffic Sources */}
      <div className="mb-4 grid gap-6 md:grid-cols-2">
        {/* Device Distribution */}
        <div className="rounded-lg border border-stroke bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-black">
            {t.deviceDistribution}
          </h2>
          <div className="h-80">
            {isLoadingAnalytics ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : deviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(1)}%`
                    }
                    animationBegin={0}
                    animationDuration={1500}
                  >
                    {deviceData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-gray-500">{t.noDataAvailable}</p>
              </div>
            )}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="rounded-lg border border-stroke bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-black">
            {t.trafficSources}
          </h2>
          <div className="h-80">
            {isLoadingAnalytics ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : sourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={50}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(1)}%`
                    }
                    animationBegin={0}
                    animationDuration={1500}
                  >
                    {sourceData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-gray-500">{t.noDataAvailable}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      
    </div>
  );
}
