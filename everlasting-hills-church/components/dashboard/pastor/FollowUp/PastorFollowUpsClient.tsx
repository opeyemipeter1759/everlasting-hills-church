"use client";

import { useState } from "react";
import {
  BadgeCheck, CheckCircle2, MessageSquareQuote, Phone, PhoneCall, PhoneForwarded,
} from "lucide-react";
import type { ContactMethod, ContactOutcome, FollowUpEntry } from "@/types/follow-up";
import { useFollowUpEntries, useLogFollowUpContact } from "@/lib/api/follow-up-pipeline";
import { timeAgo } from "@/lib/utils/time";
import { EmptyState } from "@/components/ui/display/EmptyState";
import { Select } from "@/components/ui/select";
import { PersonAvatar } from "@/components/dashboard/follow-up/PersonAvatar";

const METHOD_OPTIONS: { value: ContactMethod; label: string }[] = [
  { value: "CALL", label: "Call" },
  { value: "SMS", label: "SMS" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "VISIT", label: "Visit" },
  { value: "OTHER", label: "Other" },
];

const OUTCOME_OPTIONS: { value: ContactOutcome; label: string }[] = [
  { value: "REACHED", label: "Reached them" },
  { value: "NO_ANSWER", label: "No answer" },
  { value: "VOICEMAIL", label: "Left voicemail" },
  { value: "WRONG_NUMBER", label: "Wrong number" },
  { value: "SCHEDULED_VISIT", label: "Scheduled a visit" },
];

function hasPastoralCall(entry: FollowUpEntry): boolean {
  return entry.logs.some((l) => l.kind === "CONTACT" && l.isPastoralContact);
}

function PastorEntryCard({ entry, called }: { entry: FollowUpEntry; called: boolean }) {
  const [formOpen, setFormOpen] = useState(false);
  const [method, setMethod] = useState<ContactMethod>("CALL");
  const [outcome, setOutcome] = useState<ContactOutcome>("REACHED");
  const [note, setNote] = useState("");
  const logContact = useLogFollowUpContact();

  const detail = entry.personDetail;
  const latestLog = [...entry.logs].reverse().find((l) => !l.isPrivate) ?? null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    logContact.mutate(
      { id: entry.id, method, outcome, note: note.trim(), kind: "CONTACT", isPastoralContact: true },
      { onSuccess: () => { setNote(""); setFormOpen(false); } },
    );
  }

  return (
    <div className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl p-5 shadow-[0_1px_3px_rgba(135,16,44,0.04)] dark:shadow-none">
      <div className="flex items-start gap-3">
        <PersonAvatar person={entry.person} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-bold text-[#111] dark:text-white truncate">{entry.person.name}</p>
            {called && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                <CheckCircle2 size={9} aria-hidden="true" />
                Called
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#8a7e80] dark:text-white/40 mt-0.5">{entry.unitName} · added {timeAgo(entry.addedAt)}</p>
        </div>
      </div>

      <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
        {entry.person.phone && (
          <a href={`tel:${entry.person.phone}`} className="flex items-center gap-2 text-xs font-semibold text-[#87102C] dark:text-[#FFB3C1] hover:underline">
            <Phone size={12} aria-hidden="true" />
            {entry.person.phone}
          </a>
        )}
        {detail?.howTheyHeard && (
          <p className="flex items-start gap-2 text-xs text-gray-600 dark:text-white/50 sm:col-span-2">
            <MessageSquareQuote size={12} className="flex-shrink-0 mt-0.5 text-gray-400" aria-hidden="true" />
            <span>{detail.howTheyHeard}</span>
          </p>
        )}
        {latestLog && (
          <p className="text-xs text-gray-500 dark:text-white/40 sm:col-span-2 bg-gray-50 dark:bg-white/[0.03] rounded-lg px-3 py-2 leading-relaxed">
            "{latestLog.note}" <span className="text-[10px] text-gray-400 dark:text-white/30">— {latestLog.by.name}, {timeAgo(latestLog.at)}</span>
          </p>
        )}
      </div>

      {!formOpen ? (
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="mt-4 w-full flex items-center justify-center gap-1.5 rounded-lg bg-[#87102C] hover:bg-[#6E0C24] transition-colors px-3 py-2.5 text-xs font-bold text-white"
        >
          <PhoneCall size={13} aria-hidden="true" />
          {called ? "Log another call" : "Log this call"}
        </button>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-2.5 border-t border-[#E7CDD3]/40 dark:border-white/[0.07] pt-3.5">
          <div className="grid grid-cols-2 gap-2">
            <Select
              aria-label="Contact method"
              value={method}
              onChange={(v) => setMethod(v as ContactMethod)}
              className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs px-2.5 py-2 outline-none focus:ring-2 focus:ring-[#87102C]/25"
              options={METHOD_OPTIONS.map((m) => ({ value: m.value, label: m.label }))}
            />
            <Select
              aria-label="Contact outcome"
              value={outcome}
              onChange={(v) => setOutcome(v as ContactOutcome)}
              className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs px-2.5 py-2 outline-none focus:ring-2 focus:ring-[#87102C]/25"
              options={OUTCOME_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            />
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="How did the call go?"
            required
            autoFocus
            className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs px-3 py-2 outline-none focus:ring-2 focus:ring-[#87102C]/25 resize-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!note.trim() || logContact.isPending}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-[#87102C] hover:bg-[#6E0C24] transition-colors disabled:opacity-50"
            >
              <BadgeCheck size={12} aria-hidden="true" />
              {logContact.isPending ? "Saving…" : "Save Call"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function PastorFollowUpsClient() {
  const { data: entries = [], isLoading } = useFollowUpEntries({ pastoral: true });

  const notYetCalled = entries.filter((e) => !hasPastoralCall(e));
  const called = entries.filter(hasPastoralCall);

  if (isLoading) {
    return (
      <div className="space-y-6 px-5">
        <div className="h-6 w-56 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-5">
      <div>
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25 text-[#87102C] dark:text-[#FFB3C1]">
            <PhoneForwarded size={16} aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-xl font-black text-[#111] dark:text-white">Pastor's Call List</h1>
            <p className="text-xs text-gray-400 mt-0.5">First-timers your team felt could use a personal word from you.</p>
          </div>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl">
          <EmptyState
            icon={PhoneForwarded}
            title="Nothing here yet"
            description="When a team lead sends a first-timer your way, they'll show up here."
          />
        </div>
      ) : (
        <>
          <section className="space-y-3.5">
            <div className="flex items-center gap-2">
              <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-400">Not Yet Called</h2>
              <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-[#87102C] text-white text-[10px] font-black">
                {notYetCalled.length}
              </span>
            </div>
            {notYetCalled.length === 0 ? (
              <p className="text-xs text-[#8a7e80] dark:text-white/40 py-4">You're all caught up — nobody's waiting on a call.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {notYetCalled.map((e) => <PastorEntryCard key={e.id} entry={e} called={false} />)}
              </div>
            )}
          </section>

          <section className="space-y-3.5">
            <div className="flex items-center gap-2">
              <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-400">Called</h2>
              <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-white/50 text-[10px] font-black">
                {called.length}
              </span>
            </div>
            {called.length === 0 ? (
              <p className="text-xs text-[#8a7e80] dark:text-white/40 py-4">No calls logged yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {called.map((e) => <PastorEntryCard key={e.id} entry={e} called />)}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
