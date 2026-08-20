import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, Search, Send, Users } from "lucide-react";
import FormModal, { btnGhost, btnPrimary, fieldCls } from "@/components/ui/overlay/FormModal";
import { useUnitsList } from "@/lib/api";
import { usePeople, type PersonRow } from "@/lib/api/people";
import { ROLE_LABEL } from "@/components/dashboard/admin/people/peopleShared";
import ResultList from "@/components/dashboard/admin/people/assign-members-dialog/ResultList";
import { textLength } from "@/components/dashboard/reports/report-text-utils";
import { SkeletonBlock } from "@/components/ui/display/SkeletonBlock";
import { EMPTY_AUDIENCE } from "@/lib/api/emails";
import type { AudienceFilter, AudienceMode, EmailTemplate, RecipientPreview } from "@/lib/api/emails";

const ReportEditor = dynamic(() => import("@/components/dashboard/reports/ReportEditor"), {
  ssr: false,
  loading: () => <SkeletonBlock className="h-[180px] w-full rounded-xl" />,
});

const MODES: { value: AudienceMode; label: string }[] = [
  { value: "ALL", label: "All members" },
  { value: "UNIT", label: "A unit" },
  { value: "ROLE", label: "A role" },
  { value: "SPECIFIC", label: "Specific people" },
];

export default function SendEmailModal({
  open,
  target,
  onClose,
  onSend,
  sending,
  preview,
  onPreview,
}: {
  open: boolean;
  target: EmailTemplate | "BLANK" | null;
  onClose: () => void;
  onSend: (args: { templateId?: string; subject: string; body: string; audience: AudienceFilter }) => void;
  sending: boolean;
  preview: RecipientPreview | undefined;
  onPreview: (audience: AudienceFilter) => void;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<AudienceFilter>(EMPTY_AUDIENCE);
  const [search, setSearch] = useState("");
  const [selectedPeople, setSelectedPeople] = useState<PersonRow[]>([]);

  const { data: units } = useUnitsList();
  const peopleQuery = usePeople({ search, limit: 12, sortBy: "name", sortOrder: "asc" });
  const people = peopleQuery.data?.data ?? [];

  const isTemplate = target && target !== "BLANK";

  useEffect(() => {
    if (!open) return;
    setSubject(isTemplate ? target.subject : "");
    setBody(isTemplate ? target.body : "");
    setAudience(EMPTY_AUDIENCE);
    setSearch("");
    setSelectedPeople([]);
  }, [open, target, isTemplate]);

  useEffect(() => {
    if (!open) return;
    if (audience.mode === "UNIT" && !audience.unitId) return;
    if (audience.mode === "ROLE" && !audience.role) return;
    if (audience.mode === "SPECIFIC" && !audience.memberIds?.length) return;
    onPreview(audience);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, audience.mode, audience.unitId, audience.role, JSON.stringify(audience.memberIds)]);

  function setMode(mode: AudienceMode) {
    setAudience({ mode });
  }

  function togglePerson(p: PersonRow) {
    if (!p.profileId) return;
    setSelectedPeople((prev) => {
      const exists = prev.some((x) => x.id === p.id);
      const next = exists ? prev.filter((x) => x.id !== p.id) : [...prev, p];
      setAudience({ mode: "SPECIFIC", memberIds: next.map((x) => x.id) });
      return next;
    });
  }

  const canSubmit = useMemo(() => {
    if (subject.trim().length < 2 || textLength(body) < 2) return false;
    if (audience.mode === "UNIT" && !audience.unitId) return false;
    if (audience.mode === "ROLE" && !audience.role) return false;
    if (audience.mode === "SPECIFIC" && !audience.memberIds?.length) return false;
    return true;
  }, [subject, body, audience]);

  return (
    <FormModal
      open={open}
      title={isTemplate ? `Send "${target.name}"` : "Send Email"}
      subtitle="Choose who this reaches, then send."
      onClose={onClose}
      maxWidth="max-w-xl"
      footer={
        <>
          <button type="button" onClick={onClose} className={btnGhost}>
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit || sending}
            onClick={() =>
              onSend({
                templateId: isTemplate ? target.id : undefined,
                subject,
                body,
                audience,
              })
            }
            className={btnPrimary}
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {preview ? `Send to ${preview.count}` : "Send"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50">
            Subject
          </label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} className={fieldCls} />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50">
            Message
          </label>
          <ReportEditor value={body} onChange={setBody} placeholder="Write your message…" minHeight={180} />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50">
            Send to
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                  audience.mode === m.value
                    ? "border-[#87102C] bg-[#FFF4F6] text-[#87102C] dark:bg-[#87102C]/15 dark:border-[#87102C]/50 dark:text-[#e8768a]"
                    : "border-[#E7CDD3] dark:border-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {audience.mode === "UNIT" && (
          <select
            value={audience.unitId ?? ""}
            onChange={(e) => setAudience({ mode: "UNIT", unitId: e.target.value })}
            className={fieldCls}
          >
            <option value="" disabled>
              Select a unit…
            </option>
            {(units ?? []).map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        )}

        {audience.mode === "ROLE" && (
          <select
            value={audience.role ?? ""}
            onChange={(e) => setAudience({ mode: "ROLE", role: e.target.value as AudienceFilter["role"] })}
            className={fieldCls}
          >
            <option value="" disabled>
              Select a role…
            </option>
            {Object.entries(ROLE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        )}

        {audience.mode === "SPECIFIC" && (
          <div>
            <div className="relative mb-2">
              <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email"
                className="w-full rounded-xl border border-[#E7CDD3] dark:border-white/10 bg-white dark:bg-white/5 py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40"
              />
            </div>
            <ResultList
              rows={people}
              loading={peopleQuery.isLoading}
              isSelected={(p) => selectedPeople.some((x) => x.id === p.id)}
              onPick={togglePerson}
              multi
            />
            {selectedPeople.length > 0 && (
              <p className="mt-2 text-xs text-gray-500 dark:text-white/40">{selectedPeople.length} selected</p>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-white/[0.03] px-3.5 py-2.5 text-xs text-gray-500 dark:text-white/50">
          <Users size={14} className="shrink-0" />
          {preview ? (
            <span>
              This reaches <span className="font-semibold text-gray-900 dark:text-white">{preview.count}</span>{" "}
              {preview.count === 1 ? "person" : "people"}
              {preview.sample.length > 0 && (
                <> — {preview.sample.map((s) => s.name).join(", ")}
                {preview.count > preview.sample.length ? "…" : ""}</>
              )}
            </span>
          ) : (
            <span>Pick an audience to see how many people this reaches.</span>
          )}
        </div>
      </div>
    </FormModal>
  );
}
