import { useState } from "react";
import { Copy, Loader2 } from "lucide-react";
import { showToast } from "@/components/ui/toast/toast";
import type { MyReadinessItem, ReadinessPlanFields } from "@/lib/api/service-readiness-plans";
import { useSaveReadinessPlan } from "@/lib/api/service-readiness-updates";

const FIELDS: [keyof ReadinessPlanFields, string, string][] = [
  ["workers", "Workers assigned", "Who is serving, and anyone unavailable"],
  ["equipment", "Equipment and materials", "What you need on the day"],
  ["done", "Preparation done", "What is already ready"],
  ["outstanding", "Still outstanding", "What is left to do, and by when"],
  ["challenges", "Anticipated challenges", "Anything that could get in the way"],
  ["support", "Support needed", "Leave empty if you need nothing"],
];

type Draft = Record<keyof ReadinessPlanFields, string>;
const toDraft = (f: Partial<ReadinessPlanFields> | null): Draft =>
  Object.fromEntries(FIELDS.map(([key]) => [key, f?.[key] ?? ""])) as Draft;

/** A unit's Stage 1 plan. Starts from what was submitted, else from the roster; last service's plan is one tap away. */
export default function PlanForm({ item, onDone }: { item: MyReadinessItem; onDone: () => void }) {
  const save = useSaveReadinessPlan();
  const submitted = item.plan.state !== "NOT_STARTED";
  const [draft, setDraft] = useState<Draft>(() => (submitted ? toDraft(item.plan) : { ...toDraft(null), workers: item.roster.join("\n") }));
  const id = (key: string) => `${item.service.id}-${item.unit.id}-${key}`;

  function submit() {
    save.mutate(
      { serviceId: item.service.id, unitId: item.unit.id, ...draft },
      {
        onSuccess: () => {
          showToast.success(submitted ? "Plan updated. It goes back to the Administrator for approval." : "Plan sent to the Administrator for approval.");
          onDone();
        },
        onError: (err) => showToast.error((err as { message?: string }).message ?? "Couldn't send the plan. Please try again."),
      },
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="mt-3 grid gap-3">
      {item.previous && (
        <button type="button" onClick={() => setDraft(toDraft(item.previous))} className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]">
          <Copy size={13} aria-hidden="true" /> Start from last {item.service.serviceType === "SUNDAY" ? "Sunday" : "Wednesday"}&apos;s plan
        </button>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {FIELDS.map(([key, label, hint]) => (
          <label key={key} htmlFor={id(key)} className="grid gap-1 text-xs font-semibold text-gray-600 dark:text-white/60">
            {label}
            <textarea
              id={id(key)}
              rows={3}
              value={draft[key]}
              placeholder={hint}
              onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-normal text-gray-800 outline-none focus:border-[#87102C]/50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            />
          </label>
        ))}
      </div>
      <button type="submit" disabled={save.isPending} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl bg-[#87102C] px-5 text-sm font-bold text-white hover:bg-[#6E0C24] disabled:opacity-60">
        {save.isPending && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
        {submitted ? "Update plan" : "Submit plan"}
      </button>
    </form>
  );
}
