"use client";

type Bar = { label: string; value: number; sub?: string };

type Props = {
  data: Bar[];
  title?: string;
  color?: string;
  height?: number;
  formatValue?: (v: number) => string;
};

export default function BarChart({
  data,
  title,
  color = "bg-blue-500",
  formatValue,
}: Props) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/8 rounded-xl p-5">
      {title && (
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{title}</p>
      )}
      <div className="space-y-3">
        {data.map((bar, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[55%]">
                {bar.label}
              </span>
              <span className="text-xs font-semibold text-gray-900 dark:text-white ml-2">
                {formatValue ? formatValue(bar.value) : bar.value.toLocaleString()}
                {bar.sub && (
                  <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">
                    {bar.sub}
                  </span>
                )}
              </span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full ${color} rounded-full transition-all`}
                style={{ width: `${Math.round((bar.value / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
