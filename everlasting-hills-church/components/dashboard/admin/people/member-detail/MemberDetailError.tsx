import { BackLink } from "./shared";

export default function MemberDetailError({ message }: { message?: string }) {
  return (
    <div className="max-w-5xl space-y-5">
      <BackLink />
      <div className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-6 text-sm text-red-700 dark:text-red-400">
        {message ?? "Member not found."}
      </div>
    </div>
  );
}
