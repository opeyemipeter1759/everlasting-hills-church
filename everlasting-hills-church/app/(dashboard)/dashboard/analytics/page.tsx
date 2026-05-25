/* import { fetchAdminAnalytics } from "@/services/analytics.service";
import AnalyticsOverview from "@/components/dashboard/admin/AnalyticsOverview";

export default async function AnalyticsPage() {
  const data = await fetchAdminAnalytics();
  const serialised = JSON.parse(JSON.stringify(data));
  return <AnalyticsOverview data={serialised} />;
}
 */

import React from 'react'

export default function page() {
  return (
    <div>page</div>
  )
}
