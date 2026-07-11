import { Megaphone } from "lucide-react";
import AnnouncementCard from "./AnnouncementCard";
import type { Announcement, AnnouncementFilter } from "./types";

function Skeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#140b10] p-5 space-y-3"
        >
          <div className="h-4 w-1/3 rounded bg-gray-100 dark:bg-white/10" />
          <div className="h-3 w-2/3 rounded bg-gray-100 dark:bg-white/5" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ filter }: { filter: AnnouncementFilter }) {
  const label =
    filter === "DRAFT" ? "No drafts saved." : filter === "PUBLISHED" ? "Nothing published yet." : "No announcements yet — click New to write one.";
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 py-14 text-center">
      <Megaphone size={28} className="mx-auto text-gray-200 dark:text-white/10 mb-3" />
      <p className="text-sm text-gray-400 dark:text-white/40">{label}</p>
    </div>
  );
}

export default function AnnouncementList({
  items,
  isLoading,
  filter,
  onView,
  onEdit,
  onDelete,
  onPublish,
}: {
  items: Announcement[];
  isLoading: boolean;
  filter: AnnouncementFilter;
  onView: (a: Announcement) => void;
  onEdit: (a: Announcement) => void;
  onDelete: (a: Announcement) => void;
  onPublish: (a: Announcement) => void;
}) {
  if (isLoading) return <Skeleton />;
  if (items.length === 0) return <EmptyState filter={filter} />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
      {items.map((a) => (
        <AnnouncementCard 
          key={a.id}
          a={a}
          onView={() => onView(a)}
          onEdit={() => onEdit(a)}
          onDelete={() => onDelete(a)}
          onPublish={() => onPublish(a)}
        />
      ))}
    </div>
  );
}
