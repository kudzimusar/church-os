import DashboardClient from "./dashboard-client";

export const metadata = {
  title: "Super Admin Dashboard | Church OS",
  description: "Platform-wide command center for church operations."
};

export default function SuperAdminDashboard() {
  return <DashboardClient />;
}
