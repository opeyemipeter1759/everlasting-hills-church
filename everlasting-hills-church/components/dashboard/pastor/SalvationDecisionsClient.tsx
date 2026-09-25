"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  Check,
  Droplets,
  Mail,
  MapPin,
  MessageSquareQuote,
  Phone,
  Sparkles,
  Undo2,
} from "lucide-react";
import {
  decisionLabel,
  useSalvationDecisions,
  useSetSalvationContacted,
  type SalvationDecision,
} from "@/lib/api/salvation";
import { showToast } from "@/components/ui/toast/toast";

type Filter = "all" | "waiting" | "contacted";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** A labelled fact. Renders nothing when the person left the field blank —
 * "not given" repeated six times is noise, and absence is legible on its own. */
function Fact({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Mail;
  label: string;
  value: string | null;
  href?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={14} className="mt-0.5 shrink-0 text-[#87102C] dark:text-[#e8768a]" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-white/40">
          {label}
        </p>
        {href ? (
          <a
            href={href}
            className="block break-words text-sm font-medium text-[#87102C] hover:underline dark:text-[#e8768a]"
          >
            {value}
          </a>
        ) : (
          <p className="break-words text-sm font-medium text-gray-900 dark:text-white/85">{value}</p>
        )}
      </div>
    </div>
  );
}

function DecisionCard({ record }: { record: SalvationDecision }) {
  const setContacted = useSetSalvationContacted();
  const [note, setNote] = useState(record.note ?? "");
  const contacted = Boolean(record.contactedAt);
  const isFirstTime = record.decision === "FIRST_TIME";

  async function toggle() {
    try {
      await setContacted.mutateAsync({ id: record.id, contacted: !contacted, note });
      showToast.success(contacted ? "Marked as not yet reached" : "Marked as reached");
    } catch (err) {
      showToast.error((err as { message?: string }).message ?? "Couldn't update this");
    }
  }

  return (
    <article className="rounded-2xl border border-[#E7CDD3]/60 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04] sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {record.firstName} {record.lastName}
          </h3>
          <p
            className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
              isFirstTime
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                : "bg-[#FFE8ED] text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#FFB3C1]"
            }`}
          >
            <Sparkles size={11} aria-hidden="true" />
            {decisionLabel(record.decision)}
          </p>
        </div>
        <span className="shrink-0 text-xs text-gray-400 dark:text-white/40">{fmtDate(record.createdAt)}</span>
      </header>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Fact icon={Mail} label="Email" value={record.email} href={record.email ? `mailto:${record.email}` : undefined} />
        <Fact icon={Phone} label="Phone" value={record.phone} href={record.phone ? `tel:${record.phone}` : undefined} />
        <Fact icon={MapPin} label="Location" value={record.location} />
        <Fact icon={Building2} label="Church" value={record.churchName} />
        <Fact
          icon={Droplets}
          label="Baptism"
          value={record.interestedInBaptism === null ? null : record.interestedInBaptism ? "Interested" : "Not now"}
        />
        <Fact icon={CalendarDays} label="Came from" value={record.Event?.title ?? null} />
      </div>

      {record.Member && (
        <p className="mt-4 text-xs text-gray-500 dark:text-white/45">
          Signed in as an existing member: {record.Member.firstName} {record.Member.lastName}
        </p>
      )}

      {record.message && (
        <div className="mt-5 rounded-xl border border-[#E7CDD3]/60 bg-[#FFF8F9] p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-white/40">
            <MessageSquareQuote size={11} aria-hidden="true" /> In their words
          </p>
          <p className="whitespace-pre-line break-words text-sm leading-relaxed text-gray-700 dark:text-white/75">
            {record.message}
          </p>
        </div>
      )}

      <div className="mt-5 border-t border-[#E7CDD3]/50 pt-4 dark:border-white/[0.07]">
        <label htmlFor={`note-${record.id}`} className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-white/40">
          Follow-up note
        </label>
        <textarea
          id={`note-${record.id}`}
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Who reached them, and what happened."
          className="w-full resize-y rounded-xl border border-[#E7CDD3] bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#87102C] focus:outline-none dark:border-white/10 dark:bg-white/[0.03] dark:text-white"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggle}
            disabled={setContacted.isPending}
            className={`inline-flex min-h-10 items-center gap-2 rounded-full px-5 text-xs font-bold transition-colors disabled:opacity-60 ${
              contacted
                ? "border border-[#E7CDD3] text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5"
                : "bg-[#87102C] text-white hover:bg-[#6E0C24]"
            }`}
          >
            {contacted ? <Undo2 size={13} aria-hidden="true" /> : <Check size={13} aria-hidden="true" />}
            {contacted ? "Not reached yet" : "Mark as reached"}
          </button>
          {contacted && (
            <p className="text-xs text-gray-500 dark:text-white/45">
              Reached{record.ContactedBy?.Member ? ` by ${record.ContactedBy.Member.firstName} ${record.ContactedBy.Member.lastName}` : ""}
              {record.contactedAt ? ` · ${fmtDate(record.contactedAt)}` : ""}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * Decisions for Christ, in full.
 *
 * Every field the person submitted is on the card — the pastoral team should
 * never have to open a second screen to know who to call, where they are, or
 * what they said.
 */
export default function SalvationDecisionsClient() {
  const { data: decisions = [], isLoading } = useSalvationDecisions();
  const [filter, setFilter] = useState<Filter>("all");

  const shown = useMemo(() => {
    if (filter === "waiting") return decisions.filter((d) => !d.contactedAt);
    if (filter === "contacted") return decisions.filter((d) => d.contactedAt);
    return decisions;
  }, [decisions, filter]);

  const waiting = decisions.filter((d) => !d.contactedAt).length;

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: decisions.length },
    { key: "waiting", label: "Waiting", count: waiting },
    { key: "contacted", label: "Reached", count: decisions.length - waiting },
  ];

  return (
    <div className="space-y-6 px-4 py-6 sm:px-5">
      <header>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-[#111] dark:text-white sm:text-4xl">
          Decisions for Christ
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#8a7e80] dark:text-white/45">
          Everyone who told us they gave their life to Christ, or came back to Him. Reach out to
          the ones still waiting.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${
              filter === tab.key
                ? "border-transparent bg-[#87102C] text-white"
                : "border-[#E7CDD3] bg-white text-gray-600 hover:text-[#87102C] dark:border-white/10 dark:bg-white/5 dark:text-white/60"
            }`}
          >
            {tab.label}
            <span className={filter === tab.key ? "text-white/80" : "text-gray-400 dark:text-white/40"}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="py-16 text-center text-sm text-gray-400 dark:text-white/40">Loading…</p>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E7CDD3] py-16 text-center dark:border-white/10">
          <p className="text-sm font-semibold text-gray-600 dark:text-white/60">
            {filter === "waiting" ? "Everyone has been reached" : "No decisions recorded yet"}
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-white/40">
            {filter === "waiting"
              ? "Nothing is waiting on a follow-up."
              : "They appear here the moment somebody responds."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {shown.map((record) => (
            <DecisionCard key={record.id} record={record} />
          ))}
        </div>
      )}
    </div>
  );
}
