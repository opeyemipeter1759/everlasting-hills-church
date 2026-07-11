import { CalendarDays } from "lucide-react";
import type { ServiceRow } from "./types";
import type { ServicesApi } from "./useServices";
import ServiceCard from "./ServiceCard";

export default function ServicesGrid({
  services,
  isLoading,
  toggle,
  exportCsv,
  onEdit,
  onDelete,
}: {
  services: ServiceRow[];
  isLoading: boolean;
  toggle: ServicesApi["toggle"];
  exportCsv: (id: string) => void;
  onEdit: (s: ServiceRow) => void;
  onDelete: (s: ServiceRow) => void;
}) {
  if (isLoading) return <p className="text-sm text-gray-400">Loading...</p>;

  if (services.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-10 text-center">
        <CalendarDays className="mx-auto mb-3 text-gray-300 dark:text-white/20" size={32} />
        <p className="text-sm text-gray-400 dark:text-white/40">No services yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {services.map((s) => (
        <ServiceCard
          key={s.id}
          service={s}
          toggle={toggle}
          exportCsv={exportCsv}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
