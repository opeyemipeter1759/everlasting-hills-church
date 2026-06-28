"use client";
import { useState, useRef } from "react";
import { format } from "date-fns";
import { CalendarDays, X, ChevronDown, Filter } from "lucide-react";
import { RangeDatePicker, type DateRange } from "@/components/ui/form/DatePicker";
import type { AnalyticsFilter, Period, ServiceTypeFilter } from "@/lib/api/analytics";

const PERIODS: { label: string; value: Period }[] = [
  { label: "Today", value: "today" },
  { label: "Week",  value: "week"  },
  { label: "Month", value: "month" },
  { label: "Year",  value: "year"  },
];

const SVC_TYPES: { label: string; value: ServiceTypeFilter }[] = [
  { label: "All services",  value: "all"       },
  { label: "Sunday",        value: "sunday"    },
  { label: "Wednesday",     value: "wednesday" },
  { label: "Special",       value: "special"   },
];

interface Props {
  value: AnalyticsFilter;
  onChange: (f: AnalyticsFilter) => void;
}

export function AnalyticsFilterBar({ value, onChange }: Props) {
  const [showRange, setShowRange] = useState(false);
  const [rangeDraft, setRangeDraft] = useState<DateRange | undefined>();
  const anchorRef = useRef<HTMLButtonElement>(null);

  const isCustom = !!(value.dateFrom && value.dateTo);

  const setPeriod = (p: Period) => {
    setShowRange(false);
    setRangeDraft(undefined);
    onChange({ period: p, serviceType: value.serviceType });
  };

  const applyRange = (r: DateRange | undefined) => {
    if (r?.from && r?.to) {
      onChange({ dateFrom: format(r.from, "yyyy-MM-dd"), dateTo: format(r.to, "yyyy-MM-dd"), serviceType: value.serviceType });
      setShowRange(false);
    } else if (r?.from) {
      onChange({ dateFrom: format(r.from, "yyyy-MM-dd"), dateTo: format(r.from, "yyyy-MM-dd"), serviceType: value.serviceType });
      setShowRange(false);
    }
    setRangeDraft(undefined);
  };

  const clearCustom = () => {
    setRangeDraft(undefined);
    onChange({ period: "month", serviceType: value.serviceType });
  };

  const setSvcType = (st: ServiceTypeFilter) => onChange({ ...value, serviceType: st });

  const rangeLabel = isCustom
    ? `${format(new Date(value.dateFrom!), "dd MMM")} – ${format(new Date(value.dateTo!), "dd MMM yyyy")}`
    : null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Period quick pills */}
      <div className="inline-flex gap-0.5 p-0.5 rounded-xl bg-gray-100 dark:bg-white/5">
        {PERIODS.map((p) => (
          <button key={p.value} type="button" onClick={() => setPeriod(p.value)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${!isCustom && value.period === p.value ? "bg-white dark:bg-[#2a2a2e] text-[#87102C] shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom range button / active range badge */}
      {isCustom ? (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#87102C]/10 dark:bg-[#87102C]/20 border border-[#87102C]/20">
          <CalendarDays size={11} className="text-[#87102C]" />
          <span className="text-[11px] font-bold text-[#87102C]">{rangeLabel}</span>
          <button type="button" onClick={clearCustom} className="ml-0.5 text-[#87102C]/60 hover:text-[#87102C]">
            <X size={11} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <button ref={anchorRef} type="button" onClick={() => setShowRange((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-[#87102C]/40 hover:text-[#87102C] transition-colors bg-white dark:bg-[#1c1c1e]">
            <CalendarDays size={11} />
            Custom range
            <ChevronDown size={10} className={`transition-transform ${showRange ? "rotate-180" : ""}`} />
          </button>
          {showRange && (
            <div className="absolute top-full mt-2 left-0 z-50 bg-white dark:bg-[#1c1c1e] rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 p-4">
              <RangeDatePicker
                value={rangeDraft}
                onChange={(r) => { setRangeDraft(r); if (r?.from && r?.to) applyRange(r); }}
                placeholder="Select date range"
              />
              <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-white/8">
                <button type="button" onClick={() => setShowRange(false)} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Cancel</button>
                <button type="button" onClick={() => applyRange(rangeDraft)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#87102C] text-white hover:bg-[#6d0d24] transition-colors">Apply</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Service type filter */}
      <div className="inline-flex items-center gap-1 ml-auto">
        <Filter size={11} className="text-gray-400" />
        <div className="inline-flex gap-0.5 p-0.5 rounded-xl bg-gray-100 dark:bg-white/5">
          {SVC_TYPES.map((s) => (
            <button key={s.value} type="button" onClick={() => setSvcType(s.value)}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${(value.serviceType ?? "all") === s.value ? "bg-white dark:bg-[#2a2a2e] text-[#87102C] shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
