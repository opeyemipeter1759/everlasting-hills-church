import EventsCmsClient from "@/components/dashboard/admin/EventsCmsClient";

export const metadata = { title: "Events — Dashboard" };

/**
 * Admin CMS for church events.
 *
 * Server Component shell; the interactive list + form lives in the Client Component.
 * Middleware gates this route to ADMIN+.
 */
export default function EventsAdminPage() {
  return <EventsCmsClient />;
}
