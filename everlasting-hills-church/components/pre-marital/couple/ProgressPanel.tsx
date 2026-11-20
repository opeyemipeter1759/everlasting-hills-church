import type { CoupleOverview } from "@/lib/api/couple";
import { muted, Panel } from "./parts";

const DOT: Record<"DONE" | "CURRENT" | "UPCOMING", string> = {
  DONE: "border-[#87102C] bg-[#87102C] text-white",
  CURRENT: "border-[#87102C] bg-white text-[#87102C] dark:bg-transparent dark:text-[#FFB3C1] dark:border-[#FFB3C1]",
  UPCOMING: "border-[#E7CDD3] bg-white text-[#B9A9AE] dark:border-white/15 dark:bg-transparent dark:text-white/35",
};
const STATE_WORD = { DONE: "done", CURRENT: "where you are now", UPCOMING: "still to come" } as const;

/** Where the application is: the pastors' latest word, the steps, and who is counselling them. */
export function ProgressPanel({ data }: { data: CoupleOverview }) {
  const { application: a, counsellors } = data;
  const lead = counsellors.find((c) => c.lead) ?? counsellors[0];
  return (
    <Panel id="pmc-progress" title="Where things are">
      <p className="text-[15px] leading-relaxed text-[#111] dark:text-white/90">{a.message}</p>
      {a.stages.length > 0 && (
        <ol className="mt-5 space-y-0">
          {a.stages.map((s, i) => (
            <li key={s.label} className="relative flex gap-3 pb-5 last:pb-0">
              {i < a.stages.length - 1 && (
                <span aria-hidden="true" className={`absolute left-[13px] top-7 h-[calc(100%-1.5rem)] w-0.5 ${s.state === "DONE" ? "bg-[#87102C]" : "bg-[#E7CDD3] dark:bg-white/10"}`} />
              )}
              <span aria-hidden="true" className={`relative z-[1] flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${DOT[s.state]}`}>
                {s.state === "DONE" ? "✓" : i + 1}
              </span>
              <span className="pt-0.5">
                <span className={`block text-sm ${s.state === "CURRENT" ? "font-bold text-[#111] dark:text-white" : s.state === "DONE" ? "text-[#111] dark:text-white/85" : muted}`}>
                  {s.label}
                </span>
                <span className="sr-only">, {STATE_WORD[s.state]}</span>
                {s.state === "CURRENT" && <span className="block text-xs font-semibold text-[#87102C] dark:text-[#FFB3C1]">You are here</span>}
              </span>
            </li>
          ))}
        </ol>
      )}
      {lead && (
        <p className={`mt-5 border-t border-[#E7CDD3]/60 pt-4 text-sm dark:border-white/10 ${muted}`}>
          Your counsellor: <span className="font-semibold text-[#111] dark:text-white">{lead.name}</span>
          {counsellors.length > 1 && `, with ${counsellors.filter((c) => c !== lead).map((c) => c.name).join(" and ")}`}
        </p>
      )}
    </Panel>
  );
}
