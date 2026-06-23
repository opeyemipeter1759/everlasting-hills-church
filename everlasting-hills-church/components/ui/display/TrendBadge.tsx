import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TrendBadgeProps {
  value: number;
  suffix?: string;
  label?: string;
  size?: "sm" | "md";
}

export function TrendBadge({ value, suffix = "%", label = "vs last period", size = "sm" }: TrendBadgeProps) {
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";
  const iconSize = size === "sm" ? 9 : 11;
  const abs = Math.abs(value).toFixed(1);

  if (value === 0) {
    return (
      <span className={`inline-flex items-center gap-0.5 ${textSize} font-semibold text-gray-400`}>
        <Minus size={iconSize} /> No change
      </span>
    );
  }

  const isUp = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 ${textSize} font-bold ${isUp ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
      {isUp ? <TrendingUp size={iconSize} /> : <TrendingDown size={iconSize} />}
      {isUp ? "+" : "-"}{abs}{suffix} {label}
    </span>
  );
}
