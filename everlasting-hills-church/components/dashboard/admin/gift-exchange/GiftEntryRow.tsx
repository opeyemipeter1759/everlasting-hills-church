import { useState } from "react";
import { Mail, Phone, RotateCcw, UserX } from "lucide-react";
import { showToast } from "@/components/ui/toast/toast";
import { useReinstateGiftEntry, type GiftEntry } from "@/lib/api/gift-exchange";
import RejectPanel from "./RejectPanel";

const failed = (err: unknown) => showToast.error((err as { message?: string }).message ?? "Couldn't save that. Please try again.");
const joined = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Lagos" });
const initials = (name: string) => name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
const link = "inline-flex items-center gap-1 hover:text-[#87102C] hover:underline dark:hover:text-[#FFB3C1]";

/** One person who showed interest: who they are, how to reach them, and Reject or Reinstate. */
export default function GiftEntryRow({ entry }: { entry: GiftEntry }) {
  const reinstate = useReinstateGiftEntry();
  const [rejecting, setRejecting] = useState(false);
  const rejected = entry.status === "REJECTED";

  return (
    <li className={`px-4 py-4 sm:px-5 ${rejected ? "bg-red-50/40 dark:bg-red-500/[0.04]" : ""}`}>
      <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black ${
          rejected ? "bg-gray-200 text-gray-500 dark:bg-white/10 dark:text-white/50" : "bg-gradient-to-br from-[#A3153A] to-[#4A0718] text-[#F5C76B]"
        }`} aria-hidden="true">
          {initials(entry.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-bold ${rejected ? "text-gray-500 dark:text-white/50" : "text-[#111] dark:text-white"}`}>{entry.name}</p>
          <p className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 dark:text-white/45">
            {entry.phone && <a href={`tel:${entry.phone}`} className={link}><Phone size={12} aria-hidden="true" />{entry.phone}</a>}
            {entry.email && <a href={`mailto:${entry.email}`} className={`${link} min-w-0 truncate`}><Mail size={12} aria-hidden="true" />{entry.email}</a>}
            <span>Joined {joined(entry.createdAt)}</span>
          </p>
          {rejected && (
            <p className="mt-1 text-xs font-semibold text-red-700 dark:text-red-300">
              Rejected{entry.reviewedAt ? ` on ${joined(entry.reviewedAt)}` : ""}{entry.rejectionReason ? `: ${entry.rejectionReason}` : ""}
            </p>
          )}
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
          rejected ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
        }`}>
          {rejected ? "Rejected" : "Interested"}
        </span>
        {rejected ? (
          <button type="button" disabled={reinstate.isPending} onClick={() => reinstate.mutate(entry.id, { onSuccess: () => showToast.success(`${entry.name} is back in.`), onError: failed })}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-gray-200 px-3 text-xs font-bold text-gray-700 hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-50 dark:border-white/15 dark:text-white/80">
            <RotateCcw size={13} aria-hidden="true" /> Reinstate
          </button>
        ) : !rejecting && (
          <button type="button" onClick={() => setRejecting(true)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-red-200 px-3 text-xs font-bold text-red-700 hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10">
            <UserX size={13} aria-hidden="true" /> Reject
          </button>
        )}
      </div>
      {rejecting && !rejected && <RejectPanel entry={entry} onClose={() => setRejecting(false)} />}
    </li>
  );
}
