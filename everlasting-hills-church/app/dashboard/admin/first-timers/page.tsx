import FirstTimersClient from "@/components/dashboard/admin/FirstTimersClient";

export const metadata = { title: "First Timers | Dashboard" };
export const dynamic = "force-dynamic";

/**
 * The admin First Timers page. The list, its tabs and the cards are paged and
 * counted by the API (GET /visitors/first-timers), so the page itself only
 * renders the client.
 */
export default function FirstTimersPage() {
  return <FirstTimersClient />;
}
