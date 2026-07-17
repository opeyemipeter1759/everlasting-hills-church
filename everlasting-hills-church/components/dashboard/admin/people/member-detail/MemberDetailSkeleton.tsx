export default function MemberDetailSkeleton() {
  return (
    <div className="max-w-5xl space-y-5">
      <div className="h-6 w-24 rounded bg-gray-100 dark:bg-white/5 animate-pulse" />
      <div className="h-40 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="h-56 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
        <div className="h-56 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}
