import { Send, Users } from "lucide-react";
import { formatDateTime } from "../announcement/format";
import type { EmailSend } from "@/lib/api/emails";
import { Pagination } from "@/components/ui/navigation/Pagination";

const TH =
  "px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40 whitespace-nowrap bg-[#FFF4F6] dark:bg-[#1a1014] border-b border-[#E7CDD3]/60 dark:border-white/10";
const TD = "px-4 py-3 align-middle";

function Skeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse h-12 border-b border-gray-100 dark:border-white/[0.06] last:border-0 bg-white dark:bg-[#140b10]" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 py-14 text-center">
      <Send size={28} className="mx-auto text-gray-200 dark:text-white/10 mb-3" />
      <p className="text-sm text-gray-400 dark:text-white/40">Nothing sent yet.</p>
    </div>
  );
}

export default function SentHistoryList({
  items,
  isLoading,
  page,
  pageCount,
  onPageChange,
}: {
  items: EmailSend[];
  isLoading: boolean;
  page?: number;
  pageCount?: number;
  onPageChange?: (page: number) => void;
}) {
  if (isLoading) return <Skeleton />;
  if (items.length === 0) return <EmptyState />;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className={TH}>Subject</th>
              <th className={TH}>Sent to</th>
              <th className={`${TH} text-right`}>Recipients</th>
              <th className={`${TH} text-right`}>Sent</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr
                key={s.id}
                className="border-b border-gray-100 dark:border-white/[0.06] last:border-0 hover:bg-[#FFF4F6]/60 dark:hover:bg-white/[0.03] transition-colors"
              >
                <td className={TD}>
                  <p className="font-semibold text-gray-900 dark:text-white truncate max-w-xs">{s.subject}</p>
                </td>
                <td className={TD}>
                  <span className="text-xs text-gray-500 dark:text-white/50">{s.audienceLabel}</span>
                </td>
                <td className={`${TD} text-right`}>
                  <span className="inline-flex items-center justify-end gap-1 text-xs font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    <Users size={12} className="text-gray-400 dark:text-white/30" />
                    {s.recipients}
                  </span>
                </td>
                <td className={`${TD} text-right`}>
                  <span className="text-xs text-gray-400 dark:text-white/30 whitespace-nowrap">{formatDateTime(s.createdAt)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {page !== undefined && pageCount !== undefined && onPageChange && (
        <Pagination page={page} pageCount={pageCount} onPageChange={onPageChange} />
      )}
    </div>
  );
}
