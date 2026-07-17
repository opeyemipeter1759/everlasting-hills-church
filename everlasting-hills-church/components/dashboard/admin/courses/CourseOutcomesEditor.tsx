import { Plus, Trash2 } from "lucide-react";
import { fieldCls } from "@/components/ui/overlay/FormModal";

export default function CourseOutcomesEditor({
  outcomes,
  onChange,
}: {
  outcomes: string[];
  onChange: (outcomes: string[]) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
          What you'll learn
        </label>
        <button
          type="button"
          onClick={() => onChange([...outcomes, ""])}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#87102C] hover:text-[#6E0C24] dark:text-[#e8768a]"
        >
          <Plus size={13} /> Add outcome
        </button>
      </div>
      <div className="space-y-2">
        {outcomes.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={o}
              onChange={(e) => onChange(outcomes.map((x, idx) => (idx === i ? e.target.value : x)))}
              placeholder="e.g. Build a daily prayer rhythm"
              className={`${fieldCls} flex-1`}
            />
            <button
              type="button"
              onClick={() => onChange(outcomes.filter((_, idx) => idx !== i))}
              className="flex-shrink-0 rounded-lg p-2.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
