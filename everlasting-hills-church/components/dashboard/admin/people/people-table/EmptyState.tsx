export default function EmptyState({
  loading,
  deactivated,
}: {
  loading: boolean;
  /** Viewing the deactivated feed, where empty is good news and "add someone
   * new" is the wrong thing to suggest. */
  deactivated?: boolean;
}) {
  return (
    <div className="py-16 text-center">
      {loading ? (
        <p className="text-sm text-gray-400 dark:text-white/40">Loading people…</p>
      ) : deactivated ? (
        <>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nobody is deactivated</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Everyone on the roll is an active member.
          </p>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No people match these filters</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Adjust the search or filters, or add someone new.
          </p>
        </>
      )}
    </div>
  );
}
