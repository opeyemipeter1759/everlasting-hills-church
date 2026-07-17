"use client";
import { useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { SectionCard } from "@/components/ui/cards/SectionCard";
import { SkeletonLines } from "@/components/ui/display/SkeletonBlock";
import { GitCompare, CalendarDays } from "lucide-react";
import { RangeDatePicker, type DateRange } from "@/components/ui/form/DatePicker";
import { useAnalyticsCompare } from "@/lib/api/analytics";
import { Select } from "@/components/ui/select";

const QUICK = [
  { label: "This week",  period: "week"  },
  { label: "This month", period: "month" },
  { label: "This year",  period: "year"  },
];

const now = new Date();
const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
  return {
    label: d.toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
    value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
  };
});

type Sel = { type: "period"; period: string } | { type: "month"; month: string } | { type: "custom"; from: string; to: string };

function selToParams(s: Sel): Record<string, string> {
  if (s.type === "period") return { period: s.period };
  if (s.type === "month") {
    const d = new Date(`${s.month}-01`);
    return { dateFrom: format(startOfMonth(d), "yyyy-MM-dd"), dateTo: format(endOfMonth(d), "yyyy-MM-dd") };
  }
  return { dateFrom: s.from, dateTo: s.to };
}

function selLabel(s: Sel): string {
  if (s.type === "period") return QUICK.find((q) => q.period === s.period)?.label ?? s.period;
  if (s.type === "month")  return MONTHS.find((m) => m.value === s.month)?.label ?? s.month;
  return `${s.from} – ${s.to}`;
}

const FMT_PCT = (v: number) => `${v}%`;
const FMT_NUM = (v: number) => String(v);

const ROWS: { label: string; key: string; fmt?: (v: number) => string }[] = [
  { label: "Attendance Rate", key: "rate",        fmt: FMT_PCT },
  { label: "Total Present",   key: "present",     fmt: FMT_NUM },
  { label: "Total Absent",    key: "absent",      fmt: FMT_NUM },
  { label: "Services Held",   key: "servicesHeld",fmt: FMT_NUM },
  { label: "Avg per Service", key: "avgPerService",fmt: FMT_NUM },
];

function Delta({ diff, fmt = FMT_NUM }: { diff: number; fmt?: (v: number) => string }) {
  const cls = diff > 0 ? "text-emerald-600 dark:text-emerald-400" : diff < 0 ? "text-red-500 dark:text-red-400" : "text-gray-400";
  return <span className={`text-xs font-bold ${cls}`}>{diff > 0 ? "+" : ""}{fmt(diff)}</span>;
}

function PanelSelector({ label, color, sel, onSel }: { label: string; color: string; sel: Sel; onSel: (s: Sel) => void }) {
  const [showCustom, setShowCustom] = useState(false);
  return (
    <div className="flex-1 min-w-[200px] space-y-2 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/8">
      <p className={`text-[10px] font-black uppercase tracking-widest ${color}`}>{label}</p>
      {/* Quick periods */}
      <div className="flex flex-wrap gap-1">
        {QUICK.map((q) => (
          <button key={q.period} type="button" onClick={() => { onSel({ type: "period", period: q.period }); setShowCustom(false); }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${sel.type === "period" && sel.period === q.period ? "bg-[#87102C] text-white" : "bg-white dark:bg-white/8 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:border-[#87102C]/30"}`}>
            {q.label}
          </button>
        ))}
      </div>
      {/* Month picker */}
      <Select
        aria-label="Pick a month"
        value={sel.type === "month" ? sel.month : ""}
        onChange={(v) => { if (v) { onSel({ type: "month", month: v }); setShowCustom(false); } }}
        className="w-full text-[10px] rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 px-2.5 py-1.5 outline-none"
        options={[
          { value: "", label: "— Pick a month —" },
          ...MONTHS.map((m) => ({ value: m.value, label: m.label })),
        ]}
      />
      {/* Custom range toggle */}
      <button type="button" onClick={() => setShowCustom((v) => !v)}
        className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-500 hover:text-[#87102C] transition-colors">
        <CalendarDays size={10} />
        {sel.type === "custom" ? selLabel(sel) : "Custom range…"}
      </button>
      {showCustom && (
        <div className="pt-1">
          <RangeDatePicker
            value={sel.type === "custom" ? { from: new Date(sel.from), to: new Date(sel.to) } : undefined}
            onChange={(r: DateRange | undefined) => {
              if (r?.from && r?.to) {
                onSel({ type: "custom", from: format(r.from, "yyyy-MM-dd"), to: format(r.to, "yyyy-MM-dd") });
                setShowCustom(false);
              }
            }}
            placeholder="Pick custom range"
          />
        </div>
      )}
    </div>
  );
}

export function PeriodComparison() {
  const [a, setA] = useState<Sel>({ type: "month", month: MONTHS[10].value });
  const [b, setB] = useState<Sel>({ type: "month", month: MONTHS[11].value });

  const aParams = selToParams(a);
  const bParams = selToParams(b);
  const { data, isLoading } = useAnalyticsCompare(aParams, bParams);

  return (
    <SectionCard title="Period Comparison" iconEl={<GitCompare size={13} />}>
      <div className="flex flex-wrap gap-3 mb-4">
        <PanelSelector label="Period A" color="text-blue-500" sel={a} onSel={setA} />
        <PanelSelector label="Period B" color="text-[#87102C]" sel={b} onSel={setB} />
      </div>

      {isLoading ? <SkeletonLines lines={5} /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/8">
                <th className="py-2 text-left text-[9px] font-black uppercase tracking-widest text-gray-400">Metric</th>
                <th className="py-2 px-3 text-right text-[9px] font-black uppercase tracking-widest text-blue-500">{selLabel(a)}</th>
                <th className="py-2 px-3 text-right text-[9px] font-black uppercase tracking-widest text-[#87102C]">{selLabel(b)}</th>
                <th className="py-2 px-3 text-right text-[9px] font-black uppercase tracking-widest text-gray-400">Δ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
              {ROWS.map((row) => {
                const av = (data as any)?.periodA?.[row.key] ?? 0;
                const bv = (data as any)?.periodB?.[row.key] ?? 0;
                return (
                  <tr key={row.label}>
                    <td className="py-2 text-gray-600 dark:text-gray-400 font-medium">{row.label}</td>
                    <td className="py-2 px-3 text-right font-bold text-gray-700 dark:text-gray-300">{row.fmt ? row.fmt(av) : av}</td>
                    <td className="py-2 px-3 text-right font-bold text-gray-700 dark:text-gray-300">{row.fmt ? row.fmt(bv) : bv}</td>
                    <td className="py-2 px-3 text-right"><Delta diff={bv - av} fmt={row.fmt} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
