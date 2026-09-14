import ReadingMonitor from "@/components/dashboard/admin/reading/ReadingMonitor";

export const metadata = { title: "Bible Reading — Dashboard" };

/**
 * Client rendered: the list is filtered and searched as you type, and the
 * numbers change whenever anyone marks a day read.
 */
export default function AdminReadingPage() {
  return <ReadingMonitor />;
}
