import EventRsvpsClient from "@/components/dashboard/admin/EventRsvpsClient";

export const metadata = { title: "Event RSVPs — Dashboard" };

export default function EventRsvpsPage({ params }: { params: { id: string } }) {
  return <EventRsvpsClient id={params.id} />;
}
