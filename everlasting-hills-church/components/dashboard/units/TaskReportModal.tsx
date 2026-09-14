"use client";

import { useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
import FormModal, { btnGhost, btnPrimary } from "@/components/ui/overlay/FormModal";
import { useCreateUnitTaskReport, useUpdateUnitTaskReport } from "@/lib/api";
import type { UnitTask, UnitTaskReport, UnitTaskReportOutcome } from "@/types";
import { showToast } from "@/components/ui/toast/toast";
import type { ApiError } from "@/lib/api/axios";
import { OUTCOME_META } from "./taskReport";

const OUTCOMES: UnitTaskReportOutcome[] = ["COMPLETED", "IN_PROGRESS", "BLOCKED"];
const SUMMARY_MIN = 10;
const SUMMARY_MAX = 4000;
const NOTE_MAX = 2000;

const labelCls = "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50";
const areaCls =
  "w-full resize-y rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40";

/**
 * File (or revise) a report on a task. One modal serves both: pass `existing`
 * to edit a report the lead hasn't acknowledged yet.
 */
export default function TaskReportModal({
  unitId,
  task,
  existing,
  onClose,
}: {
  unitId: string;
  task: UnitTask | null;
  existing?: UnitTaskReport | null;
  onClose: () => void;
}) {
  const open = task !== null;
  const [outcome, setOutcome] = useState<UnitTaskReportOutcome>("IN_PROGRESS");
  const [summary, setSummary] = useState("");
  const [challenges, setChallenges] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [touched, setTouched] = useState(false);

  const create = useCreateUnitTaskReport();
  const update = useUpdateUnitTaskReport();
  const saving = create.isPending || update.isPending;

  useEffect(() => {
    if (!open) return;
    setOutcome(existing?.outcome ?? (task?.status === "DONE" ? "COMPLETED" : "IN_PROGRESS"));
    setSummary(existing?.summary ?? "");
    setChallenges(existing?.challenges ?? "");
    setNextSteps(existing?.nextSteps ?? "");
    setTouched(false);
  }, [open, existing, task?.status]);

  const summaryTrimmed = summary.trim();
  const summaryError =
    summaryTrimmed.length === 0
      ? "Tell your lead what was done."
      : summaryTrimmed.length < SUMMARY_MIN
        ? `A little more detail please (at least ${SUMMARY_MIN} characters).`
        : null;
  const blockedNeedsWhy = outcome === "BLOCKED" && challenges.trim().length === 0;
  const canSubmit = !summaryError && !blockedNeedsWhy && !saving;

  async function handleSubmit() {
    setTouched(true);
    if (!task || !canSubmit) return;
    const body = {
      outcome,
      summary: summaryTrimmed,
      challenges: challenges.trim() || undefined,
      nextSteps: nextSteps.trim() || undefined,
    };
    try {
      if (existing) {
        await update.mutateAsync({ unitId, taskId: task.id, reportId: existing.id, ...body });
        showToast.success("Report updated");
      } else {
        await create.mutateAsync({ unitId, taskId: task.id, ...body });
        showToast.success(outcome === "COMPLETED" ? "Report sent — task marked as done" : "Report sent to your unit lead");
      }
      onClose();
    } catch (err) {
      const msg = (err as ApiError)?.message;
      showToast.error(msg || "Couldn't send your report. Please try again.");
    }
  }

  return (
    <FormModal
      open={open}
      title={existing ? "Revise your report" : "Report on this task"}
      subtitle={task ? task.title : undefined}
      onClose={onClose}
      maxWidth="max-w-xl"
      footer={
        <>
          <button type="button" onClick={onClose} className={btnGhost} disabled={saving}>
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={!canSubmit} className={btnPrimary}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {saving ? "Sending…" : existing ? "Save changes" : "Send report"}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <p className={labelCls}>Where does this task stand?</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Outcome">
            {OUTCOMES.map((o) => {
              const meta = OUTCOME_META[o];
              const Icon = meta.icon;
              const active = outcome === o;
              return (
                <button
                  key={o}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setOutcome(o)}
                  className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    active
                      ? "border-[#87102C] bg-[#FFF4F6] dark:bg-[#87102C]/15 dark:border-[#87102C]/50"
                      : "border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
                >
                  <Icon size={16} className={`mt-0.5 shrink-0 ${active ? "text-[#87102C] dark:text-[#e8768a]" : "text-gray-400"}`} />
                  <span className="min-w-0">
                    <span className={`block text-xs font-bold ${active ? "text-[#87102C] dark:text-[#e8768a]" : "text-gray-800 dark:text-gray-100"}`}>
                      {meta.label}
                    </span>
                    <span className="block text-[11px] leading-snug text-gray-500 dark:text-white/45">{meta.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="task-report-summary" className={labelCls}>
            What was done <span className="text-red-500">*</span>
          </label>
          <textarea
            id="task-report-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value.slice(0, SUMMARY_MAX))}
            onBlur={() => setTouched(true)}
            rows={5}
            placeholder="Describe the work you did, what you delivered, and anything the lead should know."
            className={areaCls}
            aria-invalid={touched && !!summaryError}
          />
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className={`text-[11px] ${touched && summaryError ? "text-red-500" : "text-gray-400 dark:text-white/30"}`}>
              {touched && summaryError ? summaryError : "Be specific — this goes on the task's record."}
            </p>
            <span className="text-[10px] text-gray-400 dark:text-white/30">{summary.length}/{SUMMARY_MAX}</span>
          </div>
        </div>

        <div>
          <label htmlFor="task-report-challenges" className={labelCls}>
            Challenges {outcome === "BLOCKED" ? <span className="text-red-500">*</span> : <span className="normal-case font-normal tracking-normal text-gray-400">(optional)</span>}
          </label>
          <textarea
            id="task-report-challenges"
            value={challenges}
            onChange={(e) => setChallenges(e.target.value.slice(0, NOTE_MAX))}
            rows={3}
            placeholder={outcome === "BLOCKED" ? "What is stopping you, and what would unblock it?" : "Anything that slowed you down or needs attention."}
            className={areaCls}
            aria-invalid={touched && blockedNeedsWhy}
          />
          {touched && blockedNeedsWhy && (
            <p className="mt-1 text-[11px] text-red-500">Say what's blocking you so your lead can help.</p>
          )}
        </div>

        <div>
          <label htmlFor="task-report-next" className={labelCls}>
            Next steps <span className="normal-case font-normal tracking-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            id="task-report-next"
            value={nextSteps}
            onChange={(e) => setNextSteps(e.target.value.slice(0, NOTE_MAX))}
            rows={2}
            placeholder="What happens next, or what you need from the lead."
            className={areaCls}
          />
        </div>

        {outcome === "COMPLETED" && task?.status !== "DONE" && (
          <p className="rounded-xl bg-emerald-500/10 px-3.5 py-2.5 text-[12px] text-emerald-800 dark:text-emerald-300">
            Sending a <strong>Completed</strong> report will mark this task as done.
          </p>
        )}
      </div>
    </FormModal>
  );
}
