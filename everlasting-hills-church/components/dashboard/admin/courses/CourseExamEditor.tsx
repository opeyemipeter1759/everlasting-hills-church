import { CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";
import { fieldCls } from "@/components/ui/overlay/FormModal";
import type { ExamQuestionAdmin } from "@/lib/api/courses";

function blankQuestion(): ExamQuestionAdmin {
  return {
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    question: "",
    options: ["", "", "", ""],
    correctIndex: 0,
  };
}

export default function CourseExamEditor({
  questions,
  onChange,
}: {
  questions: ExamQuestionAdmin[];
  onChange: (questions: ExamQuestionAdmin[]) => void;
}) {
  function updateQuestion(id: string, patch: Partial<ExamQuestionAdmin>) {
    onChange(questions.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  function updateOption(qId: string, optIndex: number, value: string) {
    onChange(
      questions.map((q) => (q.id === qId ? { ...q, options: q.options.map((o, i) => (i === optIndex ? value : o)) } : q)),
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/50">
          Exam questions ({questions.length})
        </h2>
        <button
          type="button"
          onClick={() => onChange([...questions, blankQuestion()])}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#87102C] hover:text-[#6E0C24] dark:text-[#e8768a]"
        >
          <Plus size={13} /> Add question
        </button>
      </div>

      {questions.length === 0 && (
        <p className="rounded-xl border border-dashed border-gray-200 dark:border-white/10 p-6 text-center text-xs text-gray-400 dark:text-white/40">
          No exam questions yet — members can enroll and complete this course without a test.
        </p>
      )}

      <div className="space-y-4">
        {questions.map((q, qi) => (
          <div key={q.id} className="rounded-xl border border-gray-200 dark:border-white/10 p-4">
            <div className="mb-2.5 flex items-start gap-2">
              <input
                value={q.question}
                onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                placeholder={`Question ${qi + 1}`}
                className={`${fieldCls} flex-1`}
              />
              <button
                type="button"
                onClick={() => onChange(questions.filter((x) => x.id !== q.id))}
                title="Remove question"
                className="flex-shrink-0 rounded-lg p-2.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>

            <div className="space-y-1.5">
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuestion(q.id, { correctIndex: oi })}
                    title="Mark as the correct answer"
                    className="flex-shrink-0 text-gray-300 hover:text-emerald-600 dark:text-white/20"
                  >
                    {q.correctIndex === oi ? <CheckCircle2 size={17} className="text-emerald-500" /> : <Circle size={17} />}
                  </button>
                  <input
                    value={opt}
                    onChange={(e) => updateOption(q.id, oi, e.target.value)}
                    placeholder={`Option ${oi + 1}`}
                    className={`${fieldCls} flex-1 py-2 text-sm`}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
