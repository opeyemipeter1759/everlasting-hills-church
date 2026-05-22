import { fetchAdminAnalytics } from "@/services/analytics.service";
import AnalyticsOverview from "@/components/dashboard/admin/AnalyticsOverview";

export default async function AnalyticsPage() {
  const data = await fetchAdminAnalytics();
  return <AnalyticsOverview data={data} />;
}
