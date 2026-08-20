import Link from "next/link";
import { Pencil, Send, Trash2 } from "lucide-react";
import { formatRelativeDate } from "../announcement/format";
import { toPlainText } from "@/components/dashboard/reports/report-text-utils";
import type { EmailTemplate } from "@/lib/api/emails";

export default function EmailTemplateCard({
  t,
  onSend,
  onDelete,
}: {
  t: EmailTemplate;
  onSend: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group flex flex-col gap-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#140b10] p-4 sm:p-5 transition-all hover:border-gray-300 dark:hover:border-white/20 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 dark:text-white truncate">{t.name}</p>
          <p className="text-sm text-gray-500 dark:text-white/50 mt-0.5 truncate">{t.subject}</p>
        </div>
        <span className="text-[11px] text-gray-400 dark:text-white/30 flex-shrink-0">
          {formatRelativeDate(t.updatedAt)}
        </span>
      </div>

      <p className="text-sm text-gray-500 dark:text-white/40 line-clamp-2">{toPlainText(t.body)}</p>

      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={onSend}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#87102C] px-4 py-2 text-xs font-semibold text-white hover:bg-[#6E0C24] transition-colors"
        >
          <Send size={13} /> Send
        </button>

        <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity">
          <Link
            href={`/dashboard/admin/emails/${t.id}/edit`}
            title="Edit"
            aria-label="Edit"
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <Pencil size={14} />
          </Link>
          <button
            type="button"
            onClick={onDelete}
            title="Delete"
            aria-label="Delete"
            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
