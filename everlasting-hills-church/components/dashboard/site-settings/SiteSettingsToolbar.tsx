import Link from "next/link";
import { ArrowLeft, Check, Eye } from "lucide-react";

interface Props {
  label: string;
  active: string;
  isDirty: boolean;
  saved: boolean;
  saving: boolean;
  onPreview: () => void;
  onReset: () => void;
  onSave: () => Promise<boolean>;
}

export default function SiteSettingsToolbar({
  label,
  active,
  isDirty,
  saved,
  saving,
  onPreview,
  onReset,
  onSave,
}: Props) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href="/dashboard/cms"
          className="rounded-lg p-2 text-gray-400 hover:bg-[#87102C]/5 hover:text-[#87102C]"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-gray-900">{label}</h1>
          <p className="font-mono text-xs text-gray-400">Homepage · {active}</p>
        </div>
        {isDirty && <span className="text-[10px] font-semibold text-gray-400">Unsaved</span>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
            <Check size={14} /> Saved
          </span>
        )}
        <button type="button" onClick={onPreview} className={toolbarButton}>
          <Eye size={15} /> Live preview
        </button>
        <button type="button" onClick={onReset} disabled={!isDirty} className={toolbarButton}>
          Reset
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!isDirty || saving}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#87102C] px-4 py-2 text-sm font-bold text-white hover:bg-[#6E0C24] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

const toolbarButton =
  "inline-flex items-center gap-1.5 rounded-xl border border-[#E7CDD3] bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-[#FFF4F6] disabled:opacity-50";
