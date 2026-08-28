"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, CalendarDays, CheckCircle2, ChevronDown, ChevronUp, ClipboardList,
  Mail, MessageCircle, PhoneForwarded, PhoneOff, RotateCcw, Send, ShieldCheck, UsersRound,
} from "lucide-react";
import type {
  ServiceReportHistoryRow, ServiceReportRecipientGroup, ServiceReportSentVia, ServiceReportStats,
} from "@/types/follow-up";
import {
  useFollowUpServices, useSendServiceReport, useServiceReportDraft, useServiceReportHistory,
} from "@/lib/api/follow-up-pipeline";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/display/EmptyState";

interface ServiceReportPanelProps {
  unitId: string;
  unitName: string;
}

function formatServiceOption(s: { name: string; scheduledAt: string }): string {
  const date = new Date(s.scheduledAt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  return `${date} — ${s.name}`;
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

const STAT_TILES: {
  key: keyof ServiceReportStats;
  label: string;
  icon: typeof ClipboardList;
  iconBg: string;
  iconColor: string;
}[] = [
  { key: "total", label: "Followed Up", icon: ClipboardList, iconBg: "bg-[#FFE8ED] dark:bg-[#87102C]/25", iconColor: "text-[#87102C] dark:text-[#FFB3C1]" },
  { key: "reached", label: "Reached", icon: CheckCircle2, iconBg: "bg-emerald-50 dark:bg-emerald-500/15", iconColor: "text-emerald-600 dark:text-emerald-400" },
  { key: "unreachable", label: "Unreachable", icon: PhoneOff, iconBg: "bg-rose-50 dark:bg-rose-500/15", iconColor: "text-rose-600 dark:text-rose-400" },
  { key: "connectionsIntroduced", label: "Connections", icon: UsersRound, iconBg: "bg-violet-50 dark:bg-violet-500/15", iconColor: "text-violet-600 dark:text-violet-400" },
  { key: "outstanding", label: "Outstanding", icon: AlertTriangle, iconBg: "bg-amber-50 dark:bg-amber-500/15", iconColor: "text-amber-600 dark:text-amber-400" },
];

const SENT_VIA_OPTIONS: { value: ServiceReportSentVia; label: string; icon: typeof Mail }[] = [
  { value: "EMAIL", label: "Email", icon: Mail },
  { value: "WHATSAPP", label: "WhatsApp", icon: MessageCircle },
  { value: "BOTH", label: "Both", icon: Send },
];

const SENT_VIA_META: Record<ServiceReportSentVia, { label: string; icon: typeof Mail }> = {
  EMAIL: { label: "Email", icon: Mail },
  WHATSAPP: { label: "WhatsApp", icon: MessageCircle },
  BOTH: { label: "Email + WhatsApp", icon: Send },
};

const RECIPIENT_GROUP_META: Record<ServiceReportRecipientGroup, { label: string; icon: typeof ShieldCheck }> = {
  PASTOR: { label: "Pastor", icon: PhoneForwarded },
  ADMIN_HEAD: { label: "Admin Head", icon: ShieldCheck },
};

function RecipientToggle({
  group, people, checked, onToggle,
}: {
  group: ServiceReportRecipientGroup;
  people: { name: string }[];
  checked: boolean;
  onToggle: () => void;
}) {
  const meta = RECIPIENT_GROUP_META[group];
  const available = people.length > 0;
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={!available}
      aria-pressed={checked}
      title={available ? undefined : `No one currently holds the ${meta.label} role`}
      className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-left transition-colors ${
        !available
          ? "border-dashed border-gray-200 dark:border-white/10 opacity-50 cursor-not-allowed"
          : checked
            ? "border-[#87102C]/40 bg-[#FFF4F6] dark:bg-[#87102C]/10 dark:border-[#FFB3C1]/30"
            : "border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
      }`}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${
          checked && available ? "bg-[#87102C] text-white" : "bg-gray-100 dark:bg-white/10 text-gray-400"
        }`}
      >
        <meta.icon size={14} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold text-[#111] dark:text-white">{meta.label}</p>
        <p className="text-[11px] text-[#8a7e80] dark:text-white/40 truncate">
          {available ? people.map((p) => p.name).join(", ") : "Nobody currently in this role"}
        </p>
      </div>
    </button>
  );
}

function StatTiles({ stats }: { stats: ServiceReportStats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
      {STAT_TILES.map((t) => (
        <div
          key={t.key}
          className="rounded-xl border border-[#E7CDD3]/60 dark:border-white/[0.09] bg-gray-50/60 dark:bg-white/[0.03] px-3.5 py-3"
        >
          <div className={`w-7 h-7 rounded-lg ${t.iconBg} flex items-center justify-center mb-2`}>
            <t.icon size={13} className={t.iconColor} aria-hidden="true" />
          </div>
          <p className="text-lg font-black text-[#111] dark:text-white leading-none tabular-nums">{stats[t.key]}</p>
          <p className="text-[10px] font-semibold text-[#8a7e80] dark:text-white/40 mt-1 uppercase tracking-wide">{t.label}</p>
        </div>
      ))}
    </div>
  );
}

function StatTilesSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-[#E7CDD3]/60 dark:border-white/[0.09] px-3.5 py-3">
          <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 animate-pulse mb-2" />
          <div className="h-5 w-8 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
          <div className="h-2.5 w-14 bg-gray-100 dark:bg-white/5 rounded animate-pulse mt-2" />
        </div>
      ))}
    </div>
  );
}

function HistoryRow({ row }: { row: ServiceReportHistoryRow }) {
  const [open, setOpen] = useState(false);
  const viaMeta = row.sentVia ? SENT_VIA_META[row.sentVia] : null;

  return (
    <li className="px-5 py-3.5">
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full flex items-start justify-between gap-3 text-left group">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-bold text-[#111] dark:text-white truncate">
              {row.Service.name}
            </p>
            <span className="text-[10px] text-[#8a7e80] dark:text-white/35">
              {new Date(row.Service.scheduledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
          <p className="text-[11px] text-[#8a7e80] dark:text-white/40 mt-1">
            Compiled by {row.compiledByName}
            {row.sentAt && ` · sent ${new Date(row.sentAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
          </p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-[11px] font-semibold text-[#111] dark:text-white/70 tabular-nums">{row.stats.total} people</span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 size={10} aria-hidden="true" /> {row.stats.reached}
            </span>
            {row.stats.outstanding > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                <AlertTriangle size={10} aria-hidden="true" /> {row.stats.outstanding} open
              </span>
            )}
            {viaMeta && (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#87102C] dark:text-[#FFB3C1] bg-[#FFE8ED] dark:bg-[#87102C]/20 px-2 py-0.5 rounded-full">
                <viaMeta.icon size={9} aria-hidden="true" /> {viaMeta.label}
              </span>
            )}
          </div>
        </div>
        <span className="flex-shrink-0 mt-0.5 text-gray-400 group-hover:text-[#87102C] dark:group-hover:text-[#FFB3C1] transition-colors">
          {open ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
        </span>
      </button>
      {open && (
        <p className="mt-3 text-xs text-gray-600 dark:text-white/60 leading-relaxed bg-gray-50 dark:bg-white/[0.03] rounded-lg p-3.5 whitespace-pre-wrap border border-[#E7CDD3]/40 dark:border-white/[0.06]">
          {row.summaryText}
        </p>
      )}
    </li>
  );
}

export function ServiceReportPanel({ unitId, unitName }: ServiceReportPanelProps) {
  const { data: services = [] } = useFollowUpServices();
  const [serviceId, setServiceId] = useState("");
  const [summaryText, setSummaryText] = useState("");
  const [sentVia, setSentVia] = useState<ServiceReportSentVia>("WHATSAPP");
  const [recipients, setRecipients] = useState<ServiceReportRecipientGroup[]>(["PASTOR", "ADMIN_HEAD"]);

  const { data: draft, isLoading: draftLoading } = useServiceReportDraft(serviceId || undefined, unitId || undefined);
  const { data: history = [], isLoading: historyLoading } = useServiceReportHistory(unitId);
  const sendReport = useSendServiceReport();

  const appliedKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const key = serviceId && unitId ? `${serviceId}:${unitId}` : null;
    if (draft && key && appliedKeyRef.current !== key) {
      setSummaryText(draft.summaryText);
      // Default to whichever groups actually have someone in the role — no point
      // pre-checking a group that's currently empty.
      setRecipients([
        ...(draft.recipients.pastors.length > 0 ? (["PASTOR"] as const) : []),
        ...(draft.recipients.adminHeads.length > 0 ? (["ADMIN_HEAD"] as const) : []),
      ]);
      appliedKeyRef.current = key;
    }
  }, [draft, serviceId, unitId]);

  function toggleRecipientGroup(group: ServiceReportRecipientGroup) {
    setRecipients((prev) => (prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]));
  }

  const selectedService = services.find((s) => s.id === serviceId);
  const priorReport = useMemo(
    () => history.find((r) => r.serviceId === serviceId && r.unitId === unitId) ?? null,
    [history, serviceId, unitId],
  );
  const isDirty = draft ? summaryText.trim() !== draft.summaryText.trim() : false;

  function handleSend() {
    if (!serviceId || !unitId || !summaryText.trim() || recipients.length === 0) return;
    sendReport.mutate(
      { serviceId, unitId, summaryText: summaryText.trim(), sentVia, recipients },
      { onSuccess: ({ whatsappLink }) => { if (whatsappLink) window.open(whatsappLink, "_blank"); } },
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(135,16,44,0.04)] dark:shadow-none">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25 text-[#87102C] dark:text-[#FFB3C1] flex-shrink-0">
              <CalendarDays size={16} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-black text-[#111] dark:text-white">Service Report</h2>
              <p className="text-[11px] text-[#8a7e80] dark:text-white/40 mt-0.5">
                Compile {unitName}&rsquo;s follow-up summary and choose who to send it to.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-1.5 mb-5">
          <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Service day</label>
          <Select
            aria-label="Service day"
            value={serviceId}
            onChange={setServiceId}
            placeholder="Choose a service day…"
            className="w-full sm:w-80 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2.5 text-xs text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#87102C]/25"
            options={services.map((s) => ({ value: s.id, label: formatServiceOption(s) }))}
          />
        </div>

        {!serviceId ? (
          <div className="rounded-xl border border-dashed border-[#E7CDD3] dark:border-white/[0.12] py-10 text-center">
            <p className="text-xs text-[#8a7e80] dark:text-white/35">Pick a service day above to compile its follow-up report.</p>
          </div>
        ) : draftLoading ? (
          <div className="space-y-4">
            <StatTilesSkeleton />
            <div className="h-28 bg-gray-100 dark:bg-white/5 rounded-lg animate-pulse" />
          </div>
        ) : draft ? (
          <div className="space-y-5">
            {selectedService && (
              <p className="text-[11px] text-[#8a7e80] dark:text-white/40 -mt-1">{formatFullDate(selectedService.scheduledAt)}</p>
            )}

            {priorReport && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3.5 py-2.5">
                <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" aria-hidden="true" />
                <p className="text-[11px] text-emerald-800 dark:text-emerald-400">
                  Already sent {priorReport.sentAt ? new Date(priorReport.sentAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""} by {priorReport.compiledByName}. Sending again will update it.
                </p>
              </div>
            )}

            <StatTiles stats={draft.stats} />

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Send to</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <RecipientToggle
                  group="PASTOR"
                  people={draft.recipients.pastors}
                  checked={recipients.includes("PASTOR")}
                  onToggle={() => toggleRecipientGroup("PASTOR")}
                />
                <RecipientToggle
                  group="ADMIN_HEAD"
                  people={draft.recipients.adminHeads}
                  checked={recipients.includes("ADMIN_HEAD")}
                  onToggle={() => toggleRecipientGroup("ADMIN_HEAD")}
                />
              </div>
              {recipients.length === 0 && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400">Pick at least one recipient before sending.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Summary</label>
                {isDirty && (
                  <button
                    type="button"
                    onClick={() => setSummaryText(draft.summaryText)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#87102C] dark:text-[#FFB3C1] hover:underline"
                  >
                    <RotateCcw size={11} aria-hidden="true" />
                    Reset to auto-draft
                  </button>
                )}
              </div>
              <textarea
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                rows={6}
                className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs px-3.5 py-3 outline-none focus:ring-2 focus:ring-[#87102C]/25 resize-y leading-relaxed"
              />
              <p className="text-[10px] text-[#8a7e80] dark:text-white/35">
                Auto-drafted from today&rsquo;s logs — edit freely before sending. {summaryText.length.toLocaleString()} characters.
              </p>
            </div>

            {draft.outstandingEntries.length > 0 && (
              <div className="rounded-lg border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-3.5 py-3">
                <p className="text-[11px] font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle size={12} aria-hidden="true" />
                  Still open — won&rsquo;t be marked done ({draft.outstandingEntries.length})
                </p>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-400/70 mt-1 leading-relaxed">
                  {draft.outstandingEntries.map((e) => e.name).join(", ")}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1 border-t border-[#E7CDD3]/40 dark:border-white/[0.07] mt-1">
              <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-white/10 p-0.5 mt-3 sm:mt-0" role="tablist" aria-label="Send via">
                {SENT_VIA_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    role="tab"
                    aria-selected={sentVia === o.value}
                    onClick={() => setSentVia(o.value)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-bold whitespace-nowrap transition-colors ${
                      sentVia === o.value ? "bg-[#87102C] text-white" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                    }`}
                  >
                    <o.icon size={11} aria-hidden="true" />
                    {o.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleSend}
                disabled={!summaryText.trim() || recipients.length === 0 || sendReport.isPending}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#87102C] hover:bg-[#6E0C24] transition-colors disabled:opacity-50 sm:ml-auto"
              >
                <Send size={13} aria-hidden="true" />
                {sendReport.isPending ? "Sending…" : priorReport ? "Resend Report" : "Send Report"}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(135,16,44,0.04)] dark:shadow-none">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#E7CDD3]/30 dark:border-white/[0.06]">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFE8ED] dark:bg-[#87102C]/25 text-[#87102C] dark:text-[#FFB3C1]">
            <ClipboardList size={12} aria-hidden="true" />
          </span>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Report History</p>
          {history.length > 0 && (
            <span className="ml-auto text-[10px] font-bold text-[#8a7e80] dark:text-white/35 tabular-nums">{history.length} sent</span>
          )}
        </div>
        {historyLoading ? (
          <div className="divide-y divide-[#E7CDD3]/30 dark:divide-white/[0.06]">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-5 py-3.5 space-y-2">
                <div className="h-3.5 w-40 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
                <div className="h-2.5 w-56 bg-gray-100 dark:bg-white/5 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <EmptyState icon={UsersRound} title="No reports yet" description="Sent service reports will appear here." compact />
        ) : (
          <ul className="divide-y divide-[#E7CDD3]/30 dark:divide-white/[0.06]">
            {history.map((row) => <HistoryRow key={row.id} row={row} />)}
          </ul>
        )}
      </div>
    </div>
  );
}
