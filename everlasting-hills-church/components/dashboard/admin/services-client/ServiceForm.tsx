import { Select } from "@/components/ui/select";
import { TYPES } from "./types";

const inputCls =
  "w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#87102C]/40";

export default function ServiceForm({
  name,
  onNameChange,
  scheduledAt,
  onScheduledAtChange,
  serviceType,
  onServiceTypeChange,
}: {
  name: string;
  onNameChange: (v: string) => void;
  scheduledAt: string;
  onScheduledAtChange: (v: string) => void;
  serviceType: string;
  onServiceTypeChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <input
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Service name (e.g. Sunday Service — 22 June)"
        className={inputCls}
      />
      <div className="grid sm:grid-cols-2 gap-4">
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => onScheduledAtChange(e.target.value)}
          className={inputCls}
        />
        <Select
          value={serviceType}
          onChange={onServiceTypeChange}
          className={inputCls}
          aria-label="Service type"
          options={TYPES.map((t) => ({ value: t, label: t.charAt(0) + t.slice(1).toLowerCase() }))}
        />
      </div>
    </div>
  );
}
