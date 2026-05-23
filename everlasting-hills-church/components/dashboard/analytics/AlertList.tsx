"use client";

import { useState } from "react";
import type { PastoralAlertItem } from "@/services/pastoral-alerts.service";
import {
  Bell,
  Calendar,
  AlertTriangle,
  Clock,
  Heart,
  CheckCircle,
  RefreshCw,
  ChevronDown,
} from "lucide-react";

const TYPE_META: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  BIRTHDAY: { label: "Birthday", color: "bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400", icon: Heart },
  ABSENCE: { label: "Absence", color: "bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400", icon: Clock },
  INACTIVE: { label: "Inactive", color: "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400", icon: AlertTriangle },
  AT_RISK: { label: "At Risk", color: "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400", icon: AlertTriangle },
  ANNIVERSARY: { label: "Anniversary", color: "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400", icon: Calendar },
  MILESTONE: { label: "Milestone", color: "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400", icon: Bell },
};

type Props = {
  alerts: PastoralAlertItem[];
  counts: { total: number; unread: number; byType: Record<string, number> };
};

export default function AlertList({ alerts: initialAlerts, counts }: Props) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [filter, setFilter] = useState<string>("ALL");
  const [resolving, setResolving] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [msg, setMsg] = useState("");

  async function resolve(id: string) {
    setResolving(id);
    try {
      const res = await fetch(`/api/alerts/${id}/resolve`, { method: "POST" });
      if (res.ok) {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
      }
    } finally {
      setResolving(null);
    }
  }

  async function generate() {
    setGenerating(true);
    setMsg("");
    try {
      const res = await fetch("/api/alerts/generate", { method: "POST" });
      const json = await res.json();
      setMsg(json.message ?? (res.ok ? "Alerts generated. Reload to see them." : "Failed."));
    } catch {
      setMsg("Network error.");
    } finally {
      setGenerating(false);
    }
  }

  const filtered =
    filter === "ALL" ? alerts : alerts.filter((a) => a.type === filter);

  const typeKeys = Object.keys(TYPE_META);

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("ALL")}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition ${
              filter === "ALL"
                ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent"
                : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300"
            }`}
          >
            All ({counts.total})
          </button>
          {typeKeys.map((type) => {
            const meta = TYPE_META[type];
            const count = counts.byType[type] ?? 0;
            if (count === 0) return null;
            return (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition ${
                  filter === type
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent"
                    : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                }`}
              >
                {meta.label} ({count})
              </button>
            );
          })}
        </div>
        <button
          onClick={generate}
          disabled={generating}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-60 transition"
        >
          <RefreshCw size={12} className={generating ? "animate-spin" : ""} />
          {generating ? "Generating…" : "Generate Alerts"}
        </button>
      </div>
      {msg && <p className="text-xs text-green-600 dark:text-green-400">{msg}</p>}

      {/* Unread badge */}
      {counts.unread > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
          {counts.unread} unread alert{counts.unread !== 1 ? "s" : ""}
        </p>
      )}

      {/* Alert items */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-400">
          No active alerts. Click &quot;Generate Alerts&quot; to scan for issues.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => {
            const meta = TYPE_META[alert.type] ?? TYPE_META.ABSENCE;
            const Icon = meta.icon;
            return (
              <div
                key={alert.id}
                className={`bg-white dark:bg-[#1e1e1e] border rounded-xl p-4 flex gap-3 ${
                  !alert.isRead
                    ? "border-blue-200 dark:border-blue-500/30"
                    : "border-gray-200 dark:border-white/8"
                }`}
              >
                <div className={`flex-shrink-0 p-2 rounded-lg ${meta.color}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${meta.color}`}
                    >
                      {meta.label}
                    </span>
                    {!alert.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">{alert.message}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                    {alert.member.email && <span>{alert.member.email}</span>}
                    {alert.member.phone && <span>{alert.member.phone}</span>}
                    <span>{new Date(alert.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => resolve(alert.id)}
                  disabled={resolving === alert.id}
                  className="flex-shrink-0 flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 disabled:opacity-50 transition"
                  title="Mark as resolved"
                >
                  <CheckCircle size={14} />
                  <span className="hidden sm:inline">Resolve</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
