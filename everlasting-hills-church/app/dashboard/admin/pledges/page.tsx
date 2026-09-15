import PledgesOverview from "@/components/dashboard/admin/pledges/PledgesOverview";

export const metadata = { title: "Pledges — Dashboard" };

/** Client rendered: searched and filtered as you type, and refreshed on demand. */
export default function AdminPledgesPage() {
  return <PledgesOverview />;
}
