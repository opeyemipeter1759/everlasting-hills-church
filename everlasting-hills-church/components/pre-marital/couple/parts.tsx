import type { ReactNode } from "react";

/** Shared look for the couple dashboard: works on the light couple page and in the member dashboard (light or dark). */
export const panel =
  "rounded-2xl border border-[#E7CDD3]/70 bg-white p-5 shadow-[0_1px_3px_rgba(135,16,44,0.04)] dark:border-white/[0.09] dark:bg-white/[0.04] dark:shadow-none sm:p-6";
export const muted = "text-[#7A6A6F] dark:text-white/60";
export const button =
  "inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-[#E7CDD3] px-4 text-sm font-semibold text-[#111] transition hover:border-[#87102C] hover:bg-[#FFE8ED]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#87102C] dark:border-white/15 dark:text-white dark:hover:bg-white/[0.06]";

export function Panel({ id, title, children, aside }: { id: string; title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section aria-labelledby={id} className={panel}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={id} className="font-serif text-xl font-bold text-[#111] dark:text-white">
          {title}
        </h2>
        {aside}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** A calendar date with no time ("2027-03-12") as "12 March 2027". */
export const plainDate = (day: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${day}T00:00:00Z`));

export const roleWord = (role: "GROOM" | "BRIDE" | null) => (role === "GROOM" ? "intending groom" : role === "BRIDE" ? "intending bride" : null);
