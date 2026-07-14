function Block({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-200 dark:bg-white/10 rounded animate-pulse ${className}`} />;
}

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-white dark:bg-[#140b10] p-4">
      <div className="h-9 w-9 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25 animate-pulse mb-3" />
      <Block className="h-3 w-16 mb-2" />
      <Block className="h-6 w-10" />
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <tr className="border-t border-gray-100 dark:border-white/5">
      <td className="px-4 py-3.5">
        <Block className="h-4 w-4 rounded" />
      </td>
      <td className="px-4 py-3.5">
        <Block className="h-3 w-10" />
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <Block className="h-8 w-8 rounded-full flex-shrink-0" />
          <div className="space-y-1.5">
            <Block className="h-3 w-28" />
            <Block className="h-2.5 w-20" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <Block className="h-5 w-16 rounded-full" />
      </td>
      <td className="px-4 py-3.5">
        <Block className="h-3 w-24" />
      </td>
      <td className="px-4 py-3.5">
        <Block className="h-3 w-14" />
      </td>
      <td className="px-4 py-3.5">
        <Block className="h-3 w-20" />
      </td>
      <td className="px-4 py-3.5">
        <Block className="h-5 w-14 rounded-full" />
      </td>
      <td className="px-4 py-3.5">
        <Block className="h-3 w-12" />
      </td>
      <td className="px-4 py-3.5">
        <Block className="h-3 w-16" />
      </td>
      <td className="px-4 py-3.5">
        <Block className="h-3 w-20" />
      </td>
      <td className="px-4 py-3.5 text-right">
        <Block className="h-4 w-4 ml-auto" />
      </td>
    </tr>
  );
}

export default function PeopleConsoleSkeleton() {
  return (
    <div className="space-y-6 max-w-[1500px]">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Block className="h-3 w-28" />
          <Block className="h-7 w-32" />
          <Block className="h-3 w-64" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Block className="h-9 w-24 rounded-xl" />
          <Block className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Role chips */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Block key={i} className="h-7 w-20 rounded-full" />
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Block className="h-10 flex-1 min-w-[220px] max-w-md rounded-xl" />
        <Block className="h-10 w-24 rounded-xl" />
        <Block className="h-10 w-32 rounded-xl" />
        <Block className="h-10 w-28 rounded-xl" />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-white dark:bg-[#140b10] overflow-hidden">
        <div className="overflow-auto max-h-[70vh] no-scrollbar">
          <table className="w-full min-w-[1280px] border-separate border-spacing-0">
            <thead>
              <tr>
                {Array.from({ length: 12 }).map((_, i) => (
                  <th key={i} className="px-4 py-3 text-left">
                    <Block className="h-3 w-14" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <TableRowSkeleton key={i} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Block className="h-3 w-40" />
        <div className="flex items-center gap-2">
          <Block className="h-7 w-20 rounded-lg" />
          <Block className="h-7 w-7 rounded" />
          <Block className="h-3 w-10" />
          <Block className="h-7 w-7 rounded" />
        </div>
      </div>
    </div>
  );
}
