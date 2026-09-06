import UsherShell from "@/components/dashboard/usher/UsherShell";
import HeadcountHistory from "@/components/dashboard/usher/HeadcountHistory";

export const metadata = { title: "Headcount history — Ushering" };

export default function UsherHistoryPage() {
  return (
    <UsherShell
      title="Headcount history"
      subtitle="Every count recorded, newest first. Totals follow whatever you have filtered to."
    >
      <HeadcountHistory />
    </UsherShell>
  );
}
