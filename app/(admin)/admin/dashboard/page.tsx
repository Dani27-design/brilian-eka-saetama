// This is a Server Component (no "use client" directive)
import DashboardClient from "@/components/Admin/DashboardClient";

export const metadata = {
  title: "Admin Dashboard",
  description: "Overview of website content and statistics",
};

export default function Dashboard() {
  return <DashboardClient />;
}
