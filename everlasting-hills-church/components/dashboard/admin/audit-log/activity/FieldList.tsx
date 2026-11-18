import { fieldLabel, fieldsOf, plainValue } from "@/lib/audit/format";

/** Stored fields as label/value pairs; nested values shown as indented JSON. */
export function FieldList({ value }: { value: unknown }) {
  const fields = fieldsOf(value);
  if (fields.length === 0) {
    const plain = plainValue(value);
    return <p className="text-sm text-gray-700 dark:text-white/75 break-words">{plain ?? JSON.stringify(value)}</p>;
  }
  return (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]">
      {fields.map(([key, v]) => {
        const plain = plainValue(v);
        return (
          <div key={key} className="contents">
            <dt className="text-xs font-semibold text-gray-500 dark:text-white/45 sm:pt-0.5">{fieldLabel(key)}</dt>
            <dd className="min-w-0 text-sm text-gray-800 dark:text-white/80">
              {plain !== null ? (
                <span className="break-words">{plain}</span>
              ) : (
                <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-2 text-xs text-gray-700 dark:bg-white/[0.04] dark:text-white/70">
                  {JSON.stringify(v, null, 2)}
                </pre>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
