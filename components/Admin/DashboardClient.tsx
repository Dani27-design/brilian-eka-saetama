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

export default function AdminDashboard() {
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
        // Get date 6 months ago for analytics period
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const startDate = sixMonthsAgo.toISOString().split("T")[0];
        const endDate = new Date().toISOString().split("T")[0];

        // Fetch overview data with date range
        const overviewResponse = await fetch(
          `/api/analytics?startDate=${startDate}&endDate=${endDate}`,
        );
        if (!overviewResponse.ok) {
          throw new Error(`Overview API failed: ${overviewResponse.status}`);
        }
        const overviewResult = await overviewResponse.json();
        setOverviewData(overviewResult);

        // Fetch traffic trend data for 6 months
        const trafficResponse = await fetch(
          `/api/analytics/traffic?startDate=${startDate}&endDate=${endDate}`,
        );
        if (!trafficResponse.ok) {
          throw new Error(`Traffic API failed: ${trafficResponse.status}`);
        }
        const trafficResult = await trafficResponse.json();
        setTrafficData(trafficResult);

        // Fetch top pages data for 6 months
        const pagesResponse = await fetch(
          `/api/analytics/pages?startDate=${startDate}&endDate=${endDate}`,
        );
        if (!pagesResponse.ok) {
          throw new Error(`Pages API failed: ${pagesResponse.status}`);
        }
        const pagesResult = await pagesResponse.json();
        setPageViewsData(pagesResult);

        // Fetch device breakdown data for 6 months
        const deviceResponse = await fetch(
          `/api/analytics/devices?startDate=${startDate}&endDate=${endDate}`,
        );
        if (!deviceResponse.ok) {
          throw new Error(`Devices API failed: ${deviceResponse.status}`);
        }
        const deviceResult = await deviceResponse.json();
        setDeviceData(deviceResult);

        // Fetch traffic sources data for 6 months
        const sourcesResponse = await fetch(
          `/api/analytics/sources?startDate=${startDate}&endDate=${endDate}`,
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
  }, []);

  // Format the traffic data for display - group by week if showing 6 months
  const formatTrafficData = () => {
    if (!trafficData.length) return [];
    if (trafficData.length <= 30) return trafficData;

    // For 6 months data, group by week to avoid overcrowding
    const weeklyData: { date: string; visitors: number; pageViews: number }[] =
      [];

    // Create a copy of the data to avoid modifying the original
    const sortedData = [...trafficData].sort((a, b) => {
      // Safer date parsing
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);

      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime();
    });

    let currentWeek = {
      date: "",
      visitors: 0,
      pageViews: 0,
      count: 0,
    };

    sortedData.forEach((day, index) => {
      // Start new week every 7 days or if it's the first entry
      if (index === 0 || index % 7 === 0) {
        // Add the previous week to the result if not empty
        if (currentWeek.count > 0) {
          weeklyData.push({
            date: currentWeek.date,
            visitors: Math.round(currentWeek.visitors / currentWeek.count),
            pageViews: Math.round(currentWeek.pageViews / currentWeek.count),
          });
        }

        // Start a new week
        currentWeek = {
          date: day.date,
          visitors: day.visitors,
          pageViews: day.pageViews,
          count: 1,
        };
      } else {
        // Add to current week
        currentWeek.visitors += day.visitors;
        currentWeek.pageViews += day.pageViews;
        currentWeek.count += 1;
      }
    });

    // Add the last week if not empty
    if (currentWeek.count > 0) {
      weeklyData.push({
        date: currentWeek.date,
        visitors: Math.round(currentWeek.visitors / currentWeek.count),
        pageViews: Math.round(currentWeek.pageViews / currentWeek.count),
      });
    }

    return weeklyData;
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Update the formatDate function
  const formatDate = (dateStr: string) => {
    try {
      // Handle ISO date format (YYYY-MM-DD)
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
        }
      }

      // Handle YYYYMMDD format (common in analytics APIs)
      if (/^\d{8}$/.test(dateStr)) {
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        const date = new Date(`${year}-${month}-${day}`);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
        }
      }

      // Try standard Date parsing as fallback
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("en-US", {
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
    <div className="container mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-black dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Monitor website performance and visitor behavior (last 6 months)
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
          <p className="font-medium">Error fetching analytics data:</p>
          <p>{error}</p>
          <p className="mt-2 text-sm">
            Please check your API endpoints and try again.
          </p>
        </div>
      )}

      {/* Overview Section */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-black dark:text-white">
          Overview
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-black">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Page Views
              </span>
            </div>
            <h3 className="mt-2 text-2xl font-bold text-black dark:text-white">
              {isLoadingAnalytics ? "..." : overviewData.pageViews}
            </h3>
            <p className="mt-1 text-xs text-gray-500">Last 6 months</p>
          </div>

          <div className="rounded-lg border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-black">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Unique Visitors
              </span>
            </div>
            <h3 className="mt-2 text-2xl font-bold text-black dark:text-white">
              {isLoadingAnalytics ? "..." : overviewData.visitors}
            </h3>
            <p className="mt-1 text-xs text-gray-500">Last 6 months</p>
          </div>

          <div className="rounded-lg border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-black">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Avg. Time on Site
              </span>
            </div>
            <h3 className="mt-2 text-2xl font-bold text-black dark:text-white">
              {isLoadingAnalytics ? "..." : overviewData.avgTimeOnSite}
            </h3>
            <p className="mt-1 text-xs text-gray-500">Minutes:Seconds</p>
          </div>

          <div className="rounded-lg border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-black">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Bounce Rate
              </span>
            </div>
            <h3 className="mt-2 text-2xl font-bold text-black dark:text-white">
              {isLoadingAnalytics ? "..." : overviewData.bounceRate}
            </h3>
            <p className="mt-1 text-xs text-gray-500">Site average</p>
          </div>
        </div>
      </div>

      {/* Traffic Trends Chart */}
      <div className="mb-8 rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-black">
        <h2 className="mb-4 text-xl font-semibold text-black dark:text-white">
          Traffic Trends (Last 6 Months)
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
                    return formatted === value ? "Unknown" : formatted;
                  }}
                  angle={-30}
                  textAnchor="end"
                  height={60}
                  minTickGap={15}
                  interval="preserveStartEnd"
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => `Date: ${formatDate(value)}`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="pageViews"
                  name="Page Views"
                  stroke="#8884d8"
                  fillOpacity={1}
                  fill="url(#colorPageViews)"
                />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  name="Visitors"
                  stroke="#82ca9d"
                  fillOpacity={1}
                  fill="url(#colorVisitors)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-500">No traffic data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Analytics Section */}
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        {/* Top Pages */}
        <div className="rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-black">
          <h2 className="mb-4 text-xl font-semibold text-black dark:text-white">
            Top Pages
          </h2>
          <div className="h-80">
            {isLoadingAnalytics ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
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
                    width={70}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="views"
                    name="Page Views"
                    fill="url(#colorBar)"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-gray-500">No page view data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Device Distribution */}
        <div className="rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-black">
          <h2 className="mb-4 text-xl font-semibold text-black dark:text-white">
            Device Distribution
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
                <p className="text-gray-500">No device data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Traffic Sources */}
      <div className="mb-8 rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-black">
        <h2 className="mb-4 text-xl font-semibold text-black dark:text-white">
          Traffic Sources
        </h2>
        <div className="h-80">
          {isLoadingAnalytics ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : sourceData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
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
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-500">No source data available</p>
            </div>
          )}
        </div>
      </div>

      {/* User Behavior Insights */}
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-black">
        <h2 className="mb-4 text-xl font-semibold text-black dark:text-white">
          User Behavior Insights
        </h2>
        <div className="mb-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-gray-800">
            <h3 className="mb-2 text-lg font-medium text-black dark:text-white">
              Average Session Duration
            </h3>
            <p className="text-3xl font-bold text-primary">
              {isLoadingAnalytics ? "..." : overviewData.avgTimeOnSite}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {!isLoadingAnalytics && (
                <span className="text-green-500">Last 6 months</span>
              )}
            </p>
          </div>

          <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-gray-800">
            <h3 className="mb-2 text-lg font-medium text-black dark:text-white">
              Pages Per Session
            </h3>
            <p className="text-3xl font-bold text-primary">
              {isLoadingAnalytics
                ? "..."
                : (
                    Number(overviewData.pageViews.replace(/,/g, "")) /
                    Number(overviewData.visitors.replace(/,/g, ""))
                  ).toFixed(1) || "N/A"}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {!isLoadingAnalytics && (
                <span className="text-green-500">Last 6 months</span>
              )}
            </p>
          </div>

          <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-gray-800">
            <h3 className="mb-2 text-lg font-medium text-black dark:text-white">
              Bounce Rate
            </h3>
            <p className="text-3xl font-bold text-primary">
              {isLoadingAnalytics ? "..." : overviewData.bounceRate}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {!isLoadingAnalytics && (
                <span className="text-blue-500">Last 6 months</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
