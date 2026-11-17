import { notFound } from "next/navigation";
import OverviewMonth from "@/components/dashboard/follow-up/v2/overview/OverviewMonth";
import { MONTH_NAMES } from "@/components/dashboard/follow-up/v2/overview/overview-text";

function parse(params: { year: string; month: string }) {
  const year = Number(params.year);
  const month = Number(params.month);
  if (!Number.isInteger(year) || year < 2000 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12) return null;
  return { year, month };
}

export function generateMetadata({ params }: { params: { year: string; month: string } }) {
  const parsed = parse(params);
  return { title: parsed ? `${MONTH_NAMES[parsed.month - 1]} ${parsed.year} first-timers` : "Follow-up overview" };
}

/** One month of the Overview, e.g. /dashboard/follow-up/overview/2026/01. */
export default function FollowUpOverviewMonthPage({ params }: { params: { year: string; month: string } }) {
  const parsed = parse(params);
  if (!parsed) notFound();
  return <OverviewMonth year={parsed.year} month={parsed.month} />;
}
