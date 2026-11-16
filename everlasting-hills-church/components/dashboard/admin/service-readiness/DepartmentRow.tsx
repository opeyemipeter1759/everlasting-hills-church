import { useState } from "react";
import { showToast } from "@/components/ui/toast/toast";
import { useSaveReadinessUnit, type ReadinessUnit, type ReadinessUnitInput } from "@/lib/api/service-readiness";
import ChecklistEditor from "./ChecklistEditor";

/** One unit and its inspection checklists, edited inline. */
export default function DepartmentRow({ unit }: { unit: ReadinessUnit }) {
  const save = useSaveReadinessUnit();
  const [editing, setEditing] = useState(false);
  const current: ReadinessUnitInput = {
    sundayChecklist: unit.sundayChecklist,
    wednesdayChecklist: unit.wednesdayChecklist,
  };

  function submit(next: Partial<ReadinessUnitInput>, done?: () => void) {
    save.mutate(
      { unitId: unit.id, ...current, ...next },
      {
        onSuccess: () => done?.(),
        onError: (err) => showToast.error((err as { message?: string }).message ?? `Couldn't save ${unit.name}`),
      },
    );
  }

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[#111] dark:text-white">{unit.name}</p>
          <p className="text-xs text-gray-500 dark:text-white/45">
            Checklist: {unit.sundayChecklist.length} Sunday · {unit.wednesdayChecklist.length} Wednesday
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="min-h-9 rounded-full px-3 text-xs font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]"
          >
            {editing ? "Close" : "Edit checklists"}
          </button>
        </div>
      </div>
      {editing && (
        <ChecklistEditor
          unitName={unit.name}
          sunday={unit.sundayChecklist}
          wednesday={unit.wednesdayChecklist}
          saving={save.isPending}
          onCancel={() => setEditing(false)}
          onSave={({ sunday, wednesday }) =>
            submit({ sundayChecklist: sunday, wednesdayChecklist: wednesday }, () => {
              setEditing(false);
              showToast.success(`Saved ${unit.name}'s checklists`);
            })
          }
        />
      )}
    </li>
  );
}
