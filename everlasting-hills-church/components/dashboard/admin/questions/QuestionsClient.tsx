"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useQuestions, useDeleteQuestion, type QuestionRow } from "@/lib/api/questions";
import QuestionsSkeleton from "@/components/ui/skeleton/QuestionsSkeleton";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { showToast } from "@/components/ui/toast/toast";
import { errorMessage } from "./shared";
import { useQuestionFilters } from "./useQuestionFilters";
import QuestionFilters from "./QuestionFilters";
import QuestionList from "./QuestionList";

/** Admin view of every submitted question: filter, mark answered, or delete. */
export default function QuestionsClient() {
  const q = useQuestions();
  const deleteQuestion = useDeleteQuestion();
  const [confirmTarget, setConfirmTarget] = useState<QuestionRow | null>(null);
  const questions = q.data ?? [];
  const f = useQuestionFilters(questions);

  if (q.isLoading) return <QuestionsSkeleton />;

  const pendingCount = questions.filter((r) => r.status === "PENDING").length;

  async function handleDelete() {
    if (!confirmTarget) return;
    try {
      await deleteQuestion.mutateAsync(confirmTarget.id);
      showToast.success("Question deleted");
      setConfirmTarget(null);
    } catch (err) {
      showToast.error(errorMessage(err, "Couldn't delete question"));
    }
  }

  return (
    <div className="px-5 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] xs:tracking-[0.2em] text-[#87102C] dark:text-[#e8768a]">
            Administration
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Questions</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-white/50">
            {questions.length} question{questions.length === 1 ? "" : "s"}
            {pendingCount > 0 ? ` · ${pendingCount} pending` : ""} — signed-in submitters are always identified here, even when marked anonymous.
          </p>
        </div>
        <button
          type="button"
          onClick={() => q.refetch()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
        >
          <RefreshCw size={12} className={q.isFetching ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <QuestionFilters f={f} />
      <QuestionList isError={q.isError} total={questions.length} f={f} onDelete={setConfirmTarget} />

      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete question?"
        description="This cannot be undone."
        confirmLabel="Delete question"
        tone="danger"
        loading={deleteQuestion.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
