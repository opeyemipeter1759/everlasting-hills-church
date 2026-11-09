import { Check } from "lucide-react";
import type { AddToTeamState } from "./useAddToTeam";

/** How many were added, and why each failure failed. */
export default function AddResults({ s }: { s: AddToTeamState }) {
  if (s.results.length === 0) return null;
  return (
    <div className="space-y-1.5">
      {s.added > 0 && (
        <p className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          <Check size={15} /> Added {s.added} {s.added === 1 ? "person" : "people"}.
        </p>
      )}
      {s.failed.map((f) => (
        <p key={f.id} className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-400">
          {f.name}: {f.message}
        </p>
      ))}
    </div>
  );
}
