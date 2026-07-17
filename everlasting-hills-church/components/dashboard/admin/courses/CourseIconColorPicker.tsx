import { Check } from "lucide-react";
import { GRADIENT_PRESETS, ICON_OPTIONS } from "@/lib/courses-data";

export default function CourseIconColorPicker({
  iconKey,
  gradientIndex,
  onIconChange,
  onGradientChange,
}: {
  iconKey: string;
  gradientIndex: number;
  onIconChange: (key: string) => void;
  onGradientChange: (index: number) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
          Icon
        </label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(ICON_OPTIONS).map(([key, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => onIconChange(key)}
              title={key}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
                iconKey === key
                  ? "border-[#87102C] bg-[#87102C]/10 text-[#87102C] dark:text-[#e8768a]"
                  : "border-gray-200 dark:border-white/10 text-gray-400 hover:border-gray-300"
              }`}
            >
              <Icon size={17} />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
          Cover color
        </label>
        <div className="flex flex-wrap gap-2">
          {GRADIENT_PRESETS.map(([from, to], i) => (
            <button
              key={from + to}
              type="button"
              onClick={() => onGradientChange(i)}
              className="relative h-10 w-10 rounded-xl"
              style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
            >
              {gradientIndex === i && (
                <span className="absolute inset-0 flex items-center justify-center rounded-xl ring-2 ring-white/80 ring-offset-2 ring-offset-white dark:ring-offset-[#161618]">
                  <Check size={15} className="text-white" />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
