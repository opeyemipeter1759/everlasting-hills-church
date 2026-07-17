import type { EventDetail } from "@/types";
import EventCard from "./EventCard";

export default function EventsGrid({
  items,
  onOpenRsvps,
  onTogglePublish,
  onEdit,
  onDelete,
  togglingId,
}: {
  items: EventDetail[];
  onOpenRsvps: (ev: EventDetail) => void;
  onTogglePublish: (ev: EventDetail) => void;
  onEdit: (ev: EventDetail) => void;
  onDelete: (ev: EventDetail) => void;
  togglingId?: string | null;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((ev) => (
        <EventCard
          key={ev.id}
          event={ev}
          onOpenRsvps={onOpenRsvps}
          onTogglePublish={onTogglePublish}
          onEdit={onEdit}
          onDelete={onDelete}
          isToggling={togglingId === ev.id}
        />
      ))}
    </div>
  );
}
