"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Plus, Download, Lock, Unlock, Users } from "lucide-react";
import { apiClient } from "@/lib/api/axios";

interface ServiceRow {
  id: string;
  name: string;
  scheduledAt: string;
  serviceType: string;
  isOpen: boolean;
  openAt: string | null;
  closeAt: string | null;
  _count?: { AttendanceRecord: number };
}

const TYPES = ["SUNDAY", "WEDNESDAY", "SPECIAL"];

export default function ServicesClient() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [serviceType, setServiceType] = useState("SUNDAY");
  const [showForm, setShowForm] = useState(false);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const res = await apiClient.get<ServiceRow[]>("/attendance/services");
      return res.data;
    },
  });

  const create = useMutation({
    mutationFn: () =>
      apiClient.post("/attendance/services", {
        name,
        scheduledAt: new Date(scheduledAt).toISOString(),
        serviceType,
      }),
    onSuccess: () => {
      setName("");
      setScheduledAt("");
      setServiceType("SUNDAY");
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["services"] });
    },
  });

  const toggle = useMutation({
    mutationFn: ({ id, open }: { id: string; open: boolean }) =>
      apiClient.patch(`/attendance/services/${id}/${open ? "open" : "close"}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }),
  });

  async function exportCsv(id: string) {
    const res = await apiClient.get<{ filename: string; csv: string }>(
      `/attendance/services/${id}/export`,
    );
    const blob = new Blob([res.data.csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = res.data.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const canCreate = name.trim().length >= 3 && scheduledAt && !create.isPending;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Services</h1>
          <p className="text-sm text-gray-500 dark:text-white/50 mt-1">
            Create sessions, open or close check-in, and export attendance.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6E0C24] transition-colors"
        >
          <Plus size={16} />
          New Service
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#140b10] p-6 space-y-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Service name (e.g. Sunday Service — 22 June)"
            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#87102C]/40"
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#87102C]/40"
            />
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#87102C]/40"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => create.mutate()}
            disabled={!canCreate}
            className="rounded-xl bg-[#87102C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6E0C24] disabled:opacity-40 transition-colors"
          >
            {create.isPending ? "Creating..." : "Create Service"}
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : services.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-10 text-center">
          <CalendarDays className="mx-auto mb-3 text-gray-300 dark:text-white/20" size={32} />
          <p className="text-sm text-gray-400 dark:text-white/40">No services yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#140b10] p-5 flex flex-wrap items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">
                    {s.name}
                  </p>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      s.isOpen
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-white/40"
                    }`}
                  >
                    {s.isOpen ? "Open" : "Closed"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-white/40 mt-1">
                  {new Date(s.scheduledAt).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-white/50 mr-2">
                  <Users size={14} />
                  {s._count?.AttendanceRecord ?? 0}
                </span>
                <button
                  onClick={() => toggle.mutate({ id: s.id, open: !s.isOpen })}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  {s.isOpen ? <Lock size={13} /> : <Unlock size={13} />}
                  {s.isOpen ? "Close" : "Open"}
                </button>
                <button
                  onClick={() => exportCsv(s.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <Download size={13} />
                  CSV
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
