import UsherShell from "@/components/dashboard/usher/UsherShell";
import HeadcountBacklog from "@/components/dashboard/usher/HeadcountBacklog";

export const metadata = { title: "Missing counts — Ushering" };

export default function UsherBacklogPage() {
  return (
    <UsherShell
      title="Missing counts"
      subtitle="Services that have already happened with no headcount recorded. Each one can be filled in from here."
    >
      <HeadcountBacklog />
    </UsherShell>
  );
}
