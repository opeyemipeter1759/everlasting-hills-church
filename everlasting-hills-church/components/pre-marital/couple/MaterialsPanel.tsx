import type { CoupleMaterial } from "@/lib/api/couple";
import { muted, Panel } from "./parts";

/** The counselling curriculum the pastors approved: what each topic covers, scriptures, and links to read or watch. */
export function MaterialsPanel({ materials }: { materials: CoupleMaterial[] }) {
  const done = materials.filter((m) => m.completed).length;
  return (
    <Panel
      id="pmc-materials"
      title="Materials"
      aside={materials.length > 0 && <span className={`text-xs ${muted}`}>{done} of {materials.length} covered</span>}
    >
      {materials.length === 0 ? (
        <p className={`text-sm ${muted}`}>Your counselling materials will appear here as your sessions begin.</p>
      ) : (
        <ol className="space-y-3">
          {materials.map((m, i) => (
            <li key={m.id} className="rounded-xl border border-[#E7CDD3]/60 p-4 dark:border-white/10">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${m.completed ? "bg-[#87102C] text-white" : "bg-[#FFE8ED] text-[#87102C] dark:bg-white/10 dark:text-[#FFB3C1]"}`}
                >
                  {m.completed ? "✓" : i + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-[#111] dark:text-white">
                    {m.title}
                    {m.completed && <span className="sr-only"> (covered)</span>}
                  </h3>
                  {m.description && <p className={`mt-1 text-sm leading-relaxed ${muted}`}>{m.description}</p>}
                  {m.scriptureRefs.length > 0 && <p className="mt-1 text-sm italic text-[#111] dark:text-white/80">{m.scriptureRefs.join("; ")}</p>}
                  {m.resources.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                      {m.resources.map((r) => (
                        <li key={r.url}>
                          <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#87102C] underline-offset-2 hover:underline dark:text-[#FFB3C1]">
                            {r.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
