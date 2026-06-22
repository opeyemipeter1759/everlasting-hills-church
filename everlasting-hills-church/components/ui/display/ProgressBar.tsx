interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  trackColor?: string;
  height?: "xs" | "sm" | "md";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export function ProgressBar({
  value, max = 100, color = "bg-[#87102C]", trackColor = "bg-gray-100 dark:bg-white/8",
  height = "sm", showLabel, label, className = "",
}: ProgressBarProps) {
  const H = { xs: "h-1", sm: "h-1.5", md: "h-2" }[height];
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-[10px] text-gray-500 dark:text-gray-400">{label}</span>}
          {showLabel && <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">{pct.toFixed(0)}%</span>}
        </div>
      )}
      <div className={`${H} w-full ${trackColor} rounded-full overflow-hidden`}>
        <div className={`${H} ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
