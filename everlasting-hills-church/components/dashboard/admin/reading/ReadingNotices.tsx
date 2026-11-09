import { plural } from "./shared";
import type { ReadingMonitorPage } from "./useReadingMonitorPage";

const OK = "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300";

/** What just happened: plans cleared, a plan removed, a plan shared, or an action that failed. */
export default function ReadingNotices({ m }: { m: ReadingMonitorPage }) {
  return (
    <>
      {m.cleared && (
        <p role="status" className={OK}>
          Removed {plural(m.cleared.removedPlans, "plan")} from {plural(m.cleared.members, "member")}. Their reading history stays, and plans started this week were kept.
        </p>
      )}
      {m.removedPlan && (
        <p role="status" className={OK}>
          {m.removedPlan}
        </p>
      )}
      {m.actionError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300">
          {m.actionError}
        </p>
      )}
      {m.shared && (
        <p role="status" className={OK}>
          {m.shared.title} was shared with {m.shared.recipients} {m.shared.recipients === 1 ? "member" : "members"}.
        </p>
      )}
    </>
  );
}
