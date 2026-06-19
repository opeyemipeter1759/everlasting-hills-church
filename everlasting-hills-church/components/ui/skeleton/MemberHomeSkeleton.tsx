'use client';

function Bone({ className }: { className: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700/60 ${className}`} />
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] p-4 space-y-2.5">
      <div className="flex items-center justify-between">
        <Bone className="h-3 w-24" />
        <Bone className="h-7 w-7 rounded-full" />
      </div>
      <Bone className="h-8 w-16" />
      <Bone className="h-2.5 w-28" />
      <Bone className="h-2.5 w-20" />
    </div>
  );
}

function PanelSkeleton({ dark = false }: { dark?: boolean }) {
  return (
    <div className={`rounded-2xl border min-h-[440px] p-7 space-y-5 ${
      dark
        ? 'bg-gradient-to-br from-[#1a0610] via-[#0e0407] to-[#1a0610] border-white/8'
        : 'bg-white dark:bg-[#1c1c1e] border-gray-200 dark:border-white/10'
    }`}>
      <div className="space-y-2">
        <Bone className="h-2.5 w-20" />
        <Bone className="h-5 w-40" />
        <Bone className="h-px w-12" />
      </div>
      <div className="flex flex-col items-center justify-center flex-1 gap-5 pt-10">
        <Bone className="h-28 w-28 rounded-full" />
        <div className="space-y-2 flex flex-col items-center">
          <Bone className="h-4 w-40" />
          <Bone className="h-3 w-52" />
        </div>
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <Bone className="h-4 w-36" />
        <Bone className="h-3 w-16" />
      </div>
      <div className="flex items-end gap-2 h-32">
        {[60, 80, 45, 90, 55, 75, 40, 85].map((h, i) => (
          <Bone key={i} className="flex-1 rounded-sm" style={{ height: `${h}%` } as React.CSSProperties} />
        ))}
      </div>
    </div>
  );
}

function ProfileCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] p-5">
      <div className="flex items-center gap-4 mb-5">
        <Bone className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Bone className="h-4 w-32" />
          <Bone className="h-3 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Bone className="h-2.5 w-16" />
            <Bone className="h-8 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MemberHomeSkeleton() {
  return (
    <div className="space-y-5 max-w-6xl">

      {/* Welcome Banner */}
      <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Bone className="h-9 w-9 rounded-xl flex-shrink-0" />
          <div className="space-y-1.5">
            <Bone className="h-4 w-40" />
            <Bone className="h-3 w-56" />
          </div>
        </div>
        <Bone className="h-7 w-36 rounded-lg flex-shrink-0" />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Check-in + Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PanelSkeleton dark />
        <PanelSkeleton />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Profile */}
      <ProfileCardSkeleton />

    </div>
  );
}
