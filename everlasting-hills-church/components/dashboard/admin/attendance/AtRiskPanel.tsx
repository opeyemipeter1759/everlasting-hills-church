"use client";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, MoreVertical, Phone, UserX, Users } from "lucide-react";
import { useMembersAtRisk } from "@/lib/api";
import { AssignMemberModal } from "./AssignMemberModal";

type RiskType = "absent" | "never" | "low-rate";

const RISK_CONFIG: Record<RiskType, { label: string; badge: string }> = {
  absent:     { label: "Consecutive Absences", badge: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20" },
  never:      { label: "Never Attended",        badge: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20" },
  "low-rate": { label: "Below 50% Rate",        badge: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20" },
};

interface RiskRow {
  userId: string;
  userName: string;
  photoUrl: string | null;
  phone: string | null;
  meta: string;
}

function RowMenu({ row, onAssign }: { row: RiskRow; onAssign: (row: RiskRow) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Member actions"
        className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
      >
        <MoreVertical size={13} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-40 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2a2a2e] shadow-lg py-1 text-xs">
          {row.phone ? (
            <a
              href={`tel:${row.phone}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <Phone size={12} className="text-emerald-500 shrink-0" />
              Call
            </a>
          ) : (
            <span className="flex items-center gap-2.5 px-3 py-2 text-gray-400 cursor-not-allowed select-none">
              <Phone size={12} className="shrink-0" />
              No phone
            </span>
          )}

          <button
            type="button"
            onClick={() => { setOpen(false); onAssign(row); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <Users size={12} className="text-blue-500 shrink-0" />
            Assign
          </button>

          <div className="my-1 border-t border-gray-100 dark:border-white/8" />

          <button
            type="button"
            onClick={() => { setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <UserX size={12} className="shrink-0" />
            Deactivate
          </button>
        </div>
      )}
    </div>
  );
}

function Section({ type, rows, onAssign }: { type: RiskType; rows: RiskRow[]; onAssign: (row: RiskRow) => void }) {
  if (rows.length === 0) return null;
  const cfg = RISK_CONFIG[type];
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{cfg.label}</p>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.userId} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/8 hover:border-gray-200 dark:hover:border-white/15 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              {r.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.photoUrl} alt={r.userName} className="w-7 h-7 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center shrink-0 text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase">
                  {r.userName.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{r.userName}</p>
                <p className="text-[10px] text-gray-400 truncate">{r.meta}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                {cfg.label.split(" ")[0]}
              </span>
              <RowMenu row={r} onAssign={onAssign} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AtRiskPanel() {
  const { data, isLoading } = useMembersAtRisk();
  const [assignTarget, setAssignTarget] = useState<RiskRow | null>(null);

  const absent  = (data?.absentConsecutiveWeeks ?? []).map((m) => ({ userId: m.userId, userName: m.userName, photoUrl: m.photoUrl, phone: m.phone, meta: `${m.consecutiveAbsences} weeks absent${m.lastSeen ? ` · last: ${new Date(m.lastSeen).toLocaleDateString("en-GB")}` : ""}` }));
  const never   = (data?.neverAttended ?? []).map((m) => ({ userId: m.userId, userName: m.userName, photoUrl: m.photoUrl, phone: m.phone, meta: `Joined ${new Date(m.joinedAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}` }));
  const lowRate = (data?.belowFiftyPercent ?? []).map((m) => ({ userId: m.userId, userName: m.userName, photoUrl: m.photoUrl, phone: m.phone, meta: `${m.presentCount}/${m.totalCount} · ${(m.rate * 100).toFixed(1)}%` }));
  const total = absent.length + never.length + lowRate.length;

  return (
    <>
      <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-4 border-b border-gray-100 dark:border-white/8">
          <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
            <AlertTriangle size={14} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">At-Risk Members</p>
            <p className="text-[11px] text-gray-400">{isLoading ? "Loading…" : `${total} members need attention`}</p>
          </div>
        </div>
        <div className="px-5 py-4 space-y-5 max-h-[420px] no-scrollbar overflow-y-auto">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-11 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
            ))
          ) : total === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">All members are in good standing.</p>
          ) : (
            <>
              <Section type="absent" rows={absent} onAssign={setAssignTarget} />
              <Section type="never" rows={never} onAssign={setAssignTarget} />
              <Section type="low-rate" rows={lowRate} onAssign={setAssignTarget} />
            </>
          )}
        </div>
      </div>

      <AssignMemberModal
        open={assignTarget !== null}
        memberName={assignTarget?.userName ?? ""}
        onClose={() => setAssignTarget(null)}
      />
    </>
  );
}
