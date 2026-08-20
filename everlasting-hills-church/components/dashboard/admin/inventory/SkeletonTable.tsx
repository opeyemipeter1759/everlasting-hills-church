export default function SkeletonTable() {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10 animate-pulse">
      <table className="w-full text-sm">
        <tbody>
          {Array.from({ length: 6 }).map((_, i) => (
            <tr key={i} className="border-b border-gray-100 dark:border-white/[0.06] last:border-0">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-white/10 flex-shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-32 bg-gray-200 dark:bg-white/10 rounded" />
                    <div className="h-2.5 w-20 bg-gray-200 dark:bg-white/10 rounded" />
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="h-4 w-16 bg-gray-200 dark:bg-white/10 rounded-full" />
              </td>
              <td className="px-4 py-3">
                <div className="h-4 w-14 bg-gray-200 dark:bg-white/10 rounded-full" />
              </td>
              <td className="px-4 py-3">
                <div className="h-3 w-24 bg-gray-200 dark:bg-white/10 rounded" />
              </td>
              <td className="px-4 py-3 text-right">
                <div className="h-3 w-6 bg-gray-200 dark:bg-white/10 rounded ml-auto" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
