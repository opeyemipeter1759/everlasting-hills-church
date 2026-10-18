import FinanceOverview from "@/components/dashboard/admin/finance/FinanceOverview";

export const metadata = { title: "Finance — Dashboard" };

/** Client rendered: period toggled and refreshed on demand. */
export default function AdminFinancePage() {
  return <FinanceOverview />;
}
