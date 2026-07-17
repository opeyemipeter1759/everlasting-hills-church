import CalendarClient from "@/components/dashboard/admin/calendar/CalendarClient";

export const metadata = { title: "Church Calendar — Dashboard" };

/**
 * Church calendar. Server shell; the view state (month/week/day + cursor) and data
 * fetching live in the client component. ADMIN+ is enforced by the backend on
 * /events/admin/calendar and by the nav's minRole.
 */
export default function CalendarPage() {
  return <CalendarClient />;
}
