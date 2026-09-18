"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, Loader2, MessageCircle, Undo2 } from "lucide-react";
import { showToast } from "@/components/ui/toast/toast";
import { userMessageForError } from "@/lib/api/user-message";
import {
  useMarkWhatsappAdded,
  useWhatsappCommunity,
  whatsappChatLink,
  type WhatsappCommunityPerson,
} from "@/lib/api/whatsapp-community";

/**
 * First-timers who asked to join the church WhatsApp community.
 *
 * A to-do list, not a report: longest wait first, the phone number one tap
 * from an open chat, and one action — "Added" — that takes the person off the
 * list. Self-fetching, like the follow-up card beside it.
 */

const DAY_MS = 86_400_000;

function waitedFor(submittedAt: string) {
  const days = Math.floor((Date.now() - Date.parse(submittedAt)) / DAY_MS);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 14) return `${days} days ago`;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(
    new Date(submittedAt),
  );
}

export default function WhatsAppCommunityCard() {
  const [showAdded, setShowAdded] = useState(false);
  const { data, isLoading, isError, refetch } = useWhatsappCommunity(showAdded);
  const mark = useMarkWhatsappAdded();
  const [pending, setPending] = useState<string | null>(null);

  const waiting = data?.waiting ?? [];
  const added = data?.added ?? [];
  // A long list belongs on the first-timers page; this is a to-do card.
  const SHOWN = 8;
  const shown = waiting.slice(0, SHOWN);

  async function setAdded(person: WhatsappCommunityPerson, added: boolean) {
    setPending(person.id);
    try {
      await mark.mutateAsync({ id: person.id, added });
      showToast.success(
        added
          ? `${person.firstName} marked as added to the community.`
          : `${person.firstName} is back on the list.`,
      );
    } catch (error) {
      showToast.error(userMessageForError(error, "That couldn't be saved. Please try again."));
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E7CDD3]/60 bg-white shadow-[0_1px_3px_rgba(135,16,44,0.04)] dark:border-white/[0.09] dark:bg-white/[0.05] dark:shadow-none">
      <div className="flex items-center gap-3 border-b border-[#E7CDD3]/40 px-6 py-4 dark:border-white/[0.07]">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/20">
          <MessageCircle size={15} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#FFB3C1]">
            To add
          </p>
          <h3 className="-mt-0.5 text-sm font-bold text-[#111] dark:text-white">WhatsApp community</h3>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
          {waiting.length}
        </span>
      </div>

      {isLoading ? (
        <p className="px-6 py-6 text-center text-sm text-[#8a7e80] dark:text-white/40">Loading…</p>
      ) : isError ? (
        <p role="alert" className="px-6 py-6 text-center text-sm text-[#8a7e80] dark:text-white/40">
          This list couldn&apos;t load.{" "}
          <button type="button" onClick={() => refetch()} className="min-h-9 font-bold text-[#87102C] underline dark:text-[#FFB3C1]">
            Try again
          </button>
        </p>
      ) : waiting.length === 0 ? (
        <p className="px-6 py-6 text-center text-sm text-[#8a7e80] dark:text-white/40">
          Everyone who asked has been added.
        </p>
      ) : (
        <ul className="max-h-64 divide-y divide-[#E7CDD3]/30 overflow-y-auto dark:divide-white/[0.06]">
          {shown.map((person) => {
            const chat = person.phone ? whatsappChatLink(person.phone) : null;
            return (
              <li key={person.id} className="flex items-center gap-3 px-6 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight text-[#111] dark:text-white">
                    {person.firstName} {person.lastName}
                  </p>
                  <p className="truncate text-xs text-[#8a7e80] dark:text-white/40">
                    {chat ? (
                      <a href={chat} target="_blank" rel="noreferrer" className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
                        {person.phone}
                      </a>
                    ) : (
                      person.phone || person.email || "No number given"
                    )}
                    <span className="text-[#b8a8ac] dark:text-white/25"> · asked {waitedFor(person.submittedAt)}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAdded(person, true)}
                  disabled={pending === person.id}
                  className="inline-flex min-h-9 flex-shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {pending === person.id ? (
                    <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Check size={13} aria-hidden="true" />
                  )}
                  Added
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="border-t border-[#E7CDD3]/40 px-6 py-3 dark:border-white/[0.07]">
        {waiting.length > SHOWN && (
          <Link
            href="/dashboard/admin/first-timers"
            className="mb-2 flex min-h-9 items-center gap-1 text-xs font-bold text-[#87102C] hover:underline dark:text-[#FFB3C1]"
          >
            View all {waiting.length} in First Timers <ChevronRight size={13} aria-hidden="true" />
          </Link>
        )}
        <button
          type="button"
          onClick={() => setShowAdded((current) => !current)}
          className="min-h-9 text-xs font-bold text-[#87102C] hover:underline dark:text-[#FFB3C1]"
        >
          {showAdded ? "Hide recently added" : "Show recently added"}
        </button>
        {showAdded && (
          added.length === 0 ? (
            <p className="mt-2 text-xs text-[#8a7e80] dark:text-white/40">Nobody has been marked yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {added.map((person) => (
                <li key={person.id} className="flex items-center justify-between gap-3 text-xs">
                  <span className="min-w-0 truncate text-[#8a7e80] dark:text-white/50">
                    {person.firstName} {person.lastName}
                    {person.whatsappAddedAt && (
                      <span className="text-[#b8a8ac] dark:text-white/25">
                        {" "}· added {waitedFor(person.whatsappAddedAt)}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAdded(person, false)}
                    disabled={pending === person.id}
                    aria-label={`Put ${person.firstName} ${person.lastName} back on the list`}
                    className="inline-flex min-h-9 flex-shrink-0 items-center gap-1 font-bold text-[#87102C] hover:underline disabled:opacity-60 dark:text-[#FFB3C1]"
                  >
                    <Undo2 size={12} aria-hidden="true" />
                    Undo
                  </button>
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    </div>
  );
}
