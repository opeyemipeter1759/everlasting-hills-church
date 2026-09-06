import UsherShell from "@/components/dashboard/usher/UsherShell";
import UsherHeadcountEntry from "@/components/dashboard/admin/attendance/headcount/UsherHeadcountEntry";

export const metadata = { title: "Record attendance — Ushering" };

/**
 * `?date=` lets the backlog and history screens hand the usher a date rather
 * than asking them to find it in a picker again.
 */
export default function UsherRecordPage({
  searchParams,
}: {
  searchParams?: { date?: string };
}) {
  const date = typeof searchParams?.date === "string" ? searchParams.date : undefined;
  const valid = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;

  return (
    <UsherShell
      title="Record attendance"
      subtitle="Pick the service date and fill in the congregation headcount. This is the authoritative count of everyone present."
    >
      <UsherHeadcountEntry initialDate={valid} />
    </UsherShell>
  );
}
