import { CheckCircle2, Circle, ShieldQuestion, Trash2 } from "lucide-react";
import { fieldCls } from "@/components/ui/overlay/FormModal";
import type { ModuleCheckAdmin } from "@/lib/api/courses";

export default function ModuleCheckEditor({
  check,
  onChange,
}: {
  check: ModuleCheckAdmin | null;
  onChange: (check: ModuleCheckAdmin | null) => void;
}) {
  if (!check) {
    return (
      <button
        type="button"
        onClick={() => onChange({ question: "", options: ["", "", "", ""], correctIndex: 0 })}
        className="inline-flex items-center gap-1.5 pt-1 text-xs font-semibold text-gray-400 hover:text-[#87102C] dark:hover:text-[#e8768a]"
      >
        <ShieldQuestion size={13} /> Add checkpoint question
      </button>
    );
  }

  function updateOption(oi: number, value: string) {
    if (!check) return;
    onChange({ ...check, options: check.options.map((o, i) => (i === oi ? value : o)) });
  }

  return (
    <div className="space-y-2 rounded-lg border border-dashed border-[#87102C]/30 dark:border-[#e8768a]/30 bg-[#87102C]/[0.03] dark:bg-[#87102C]/10 p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#87102C] dark:text-[#e8768a]">
        <ShieldQuestion size={12} /> Checkpoint question — must answer correctly to unlock the next module
      </div>

      <div className="flex items-start gap-2">
        <input
          value={check.question}
          onChange={(e) => onChange({ ...check, question: e.target.value })}
          placeholder="Question"
          className={`${fieldCls} flex-1 py-2 text-sm`}
        />
        <button
          type="button"
          onClick={() => onChange(null)}
          title="Remove checkpoint question"
          className="flex-shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="space-y-1.5">
        {check.options.map((opt, oi) => (
          <div key={oi} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...check, correctIndex: oi })}
              title="Mark as the correct answer"
              className="flex-shrink-0 text-gray-300 hover:text-emerald-600 dark:text-white/20"
            >
              {check.correctIndex === oi ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Circle size={16} />}
            </button>
            <input
              value={opt}
              onChange={(e) => updateOption(oi, e.target.value)}
              placeholder={`Option ${oi + 1}`}
              className={`${fieldCls} flex-1 py-1.5 text-sm`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
