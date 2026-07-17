import { Suspense } from "react";
import EventsCmsClient from "@/components/dashboard/admin/EventsCmsClient";

export const metadata = { title: "Events — Dashboard" };

/**
 * EventsCmsClient reads ?new/&date (the calendar's "add event" deep link) via
 * useSearchParams, which must sit inside a Suspense boundary or the build fails
 * when this route is statically rendered.
 */
export default function EventsAdminPage() {
  return (
    <Suspense fallback={null}>
      <EventsCmsClient />
    </Suspense>
  );
}
