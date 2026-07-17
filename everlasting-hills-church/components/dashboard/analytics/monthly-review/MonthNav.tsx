import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import Loader from "@/components/ui/feedback/Loader";

interface Props {
  label: string;
  isCurrentMonth: boolean;
  isFetching: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

const NAV_BTN =
  "p-2 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 " +
  "hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed";

const TODAY_BTN =
  "ml-1 inline-flex items-center gap-1.5 text-xs font-semibold text-[#87102C] dark:text-[#e8768a] " +
  "hover:underline disabled:opacity-40";

export default function MonthNav({ label, isCurrentMonth, isFetching, onPrev, onNext, onToday }: Props) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={onPrev} disabled={isFetching} aria-label="Previous month" className={NAV_BTN}>
        <ChevronLeft size={16} />
      </button>

      <div className="flex min-w-[130px] items-center justify-center gap-2">
        <p className="text-center text-sm font-bold text-gray-900 dark:text-white">{label}</p>
        {isFetching && <Loader size="xs" className="text-gray-400" />}
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={isCurrentMonth || isFetching}
        aria-label="Next month"
        className={NAV_BTN}
      >
        <ChevronRight size={16} />
      </button>

      {!isCurrentMonth && (
        <button
          type="button"
          onClick={onToday}
          disabled={isFetching}
          className={TODAY_BTN}
        >
          <RotateCcw size={12} />
          This month
        </button>
      )}
    </div>
  );
}
