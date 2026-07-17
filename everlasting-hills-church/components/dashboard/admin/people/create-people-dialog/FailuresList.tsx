import { UserPlus } from "lucide-react";

export default function FailuresList({ failures }: { failures: { email: string; reason: string }[] }) {
  if (failures.length === 0) return null;
  return (
    <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400">
      <p className="font-semibold mb-1 inline-flex items-center gap-1">
        <UserPlus size={14} /> {failures.length} could not be created:
      </p>
      <ul className="list-disc list-inside text-xs space-y-0.5">
        {failures.map((f) => (
          <li key={f.email}>
            <strong>{f.email}</strong> — {f.reason}
          </li>
        ))}
      </ul>
    </div>
  );
}
