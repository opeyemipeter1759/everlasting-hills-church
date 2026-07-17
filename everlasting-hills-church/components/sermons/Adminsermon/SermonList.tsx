'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Pencil,
  Trash2,
  BookOpen,
  Mic2,
  Layers,
  ChevronDown,
  Check,
  Clock,
  FileText,
  MoreVertical,
  Loader2,
  Plus,
} from 'lucide-react';
import { useAdminSermons, useDeleteSermon, useUpdateSermon } from '@/lib/api';
import { showToast } from '@/components/ui/toast/toast';
import { Select } from '@/components/ui/select';
import type { LatestSermon, SermonStatus, SermonType } from '@/types';

const STATUS_OPTIONS: SermonStatus[] = ['DRAFT', 'PUBLISHED', 'SCHEDULED'];

const STATUS_STYLE: Record<SermonStatus, { badge: string; dot: string; icon: React.ReactNode; label: string }> = {
  PUBLISHED: {
    badge: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    icon: <Check size={10} />,
    label: 'Published',
  },
  DRAFT: {
    badge: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
    icon: <FileText size={10} />,
    label: 'Draft',
  },
  SCHEDULED: {
    badge: 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400',
    dot: 'bg-sky-500',
    icon: <Clock size={10} />,
    label: 'Scheduled',
  },
};

export default function SermonList() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState<SermonType | ''>('');
  const [statusFilter, setStatusFilter] = useState<SermonStatus | ''>('');
  const [statusMenu, setStatusMenu] = useState<{ id: string; top: number; left: number } | null>(null);
  const [savingStatusId, setSavingStatusId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LatestSermon | null>(null);

  const { data: sermons, isLoading } = useAdminSermons({
    ...(statusFilter && { status: statusFilter }),
  });
  const deleteSermon = useDeleteSermon();
  const updateSermon = useUpdateSermon();

  const rows = (sermons ?? []).filter((s) => {
    const matchesQ =
      !q ||
      s.title.toLowerCase().includes(q.toLowerCase()) ||
      s.speaker.toLowerCase().includes(q.toLowerCase());
    const matchesType = !typeFilter || (s.type ?? 'SINGLE') === typeFilter;
    return matchesQ && matchesType;
  });

  function changeStatus(id: string, status: SermonStatus) {
    setStatusMenu(null);
    setSavingStatusId(id);
    updateSermon.mutate(
      { id, payload: { status } },
      {
        onSuccess: () => {
          showToast.success(`Marked as ${STATUS_STYLE[status].label}`);
        },
        onError: (err) => {
          showToast.error((err as { message?: string })?.message ?? 'Failed to update status');
        },
        onSettled: () => setSavingStatusId(null),
      },
    );
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    deleteSermon.mutate(target.id, {
      onSuccess: () => {
        showToast.success(`"${target.title}" deleted`);
        setDeleteTarget(null);
      },
      onError: (err) => {
        showToast.error((err as { message?: string })?.message ?? 'Failed to delete sermon');
      },
    });
  }

  return (
    <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <div>
          <h2 className="font-sans text-sm font-black text-gray-900 dark:text-white tracking-tight">
            All Sermons
          </h2>
          <p className="font-sans text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
            {isLoading ? 'Loading…' : `${sermons?.length ?? 0} message${(sermons?.length ?? 0) !== 1 ? 's' : ''} · edit, publish or remove`}
          </p>
        </div>
         <button
                    type="button"
                    onClick={() => router.push('/dashboard/pastor/sermons/new')}
                    className="font-sans inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#87102C] px-4 py-2 text-xs font-bold text-white hover:bg-[#6E0C24] active:scale-[0.97] transition-all"
                  >
                    <Plus size={13} strokeWidth={2.5} />
                    New Sermon
                  </button>
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title or speaker…"
            className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#87102C]/25"
          />
        </div>
        <Select
          aria-label="Filter by type"
          value={typeFilter}
          onChange={(v) => setTypeFilter(v as SermonType | '')}
          className="text-xs rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 px-2.5 py-2 outline-none"
          options={[
            { value: '', label: 'All Types' },
            { value: 'SINGLE', label: 'Single' },
            { value: 'SERIES', label: 'Series' },
          ]}
        />
        <Select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as SermonStatus | '')}
          className="text-xs rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 px-2.5 py-2 outline-none"
          options={[
            { value: '', label: 'All Status' },
            { value: 'PUBLISHED', label: 'Published' },
            { value: 'DRAFT', label: 'Draft' },
            { value: 'SCHEDULED', label: 'Scheduled' },
          ]}
        />
      </div>

      {/* ── Table ──────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50/70 dark:bg-white/[0.02]">
            <tr>
              <th scope="col" className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">
                Sermon
              </th>
              <th scope="col" className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">
                Type
              </th>
              <th scope="col" className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">
                Date
              </th>
              <th scope="col" className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/8">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-gray-200 dark:bg-gray-700" />
                      <div className="space-y-1.5">
                        <div className="h-3 w-40 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-2.5 w-28 rounded bg-gray-100 dark:bg-gray-800" />
                      </div>
                    </div>
                  </td>
                  {['w-16', 'w-20', 'w-16', 'w-14'].map((w, j) => (
                    <td key={j} className="px-4 py-3"><div className={`h-3 rounded bg-gray-200 dark:bg-gray-700 ${w}`} /></td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-14">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/5">
                      <BookOpen size={16} className="text-gray-400" />
                    </div>
                    <p className="font-sans text-sm font-semibold text-gray-500 dark:text-gray-400">
                      {sermons?.length ? 'No sermons match your filters' : 'No sermons yet'}
                    </p>
                    <p className="font-sans text-xs text-gray-400 dark:text-gray-600">
                      {sermons?.length ? 'Try adjusting your search or filters' : 'Create your first sermon to see it here'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((s) => {
                const status = (s.status as SermonStatus) in STATUS_STYLE ? (s.status as SermonStatus) : 'DRAFT';
                const st = STATUS_STYLE[status];
                const type = s.type ?? 'SINGLE';
                return (
                  <tr key={s.id} className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#87102C]/10 dark:bg-[#87102C]/20 text-[#87102C] dark:text-[#e8768a]">
                          {type === 'SERIES' ? <Layers size={13} /> : <Mic2 size={13} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[280px]">
                            {s.title}
                          </p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate max-w-[280px]">
                            {s.speaker}
                            {s.scriptureRef ? ` · ${s.scriptureRef}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                        {type === 'SERIES' ? <Layers size={11} /> : <Mic2 size={11} />}
                        {type === 'SERIES' ? 'Series' : 'Single'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          if (statusMenu?.id === s.id) {
                            setStatusMenu(null);
                            return;
                          }
                          const rect = e.currentTarget.getBoundingClientRect();
                          setStatusMenu({ id: s.id, top: rect.bottom + 4, left: rect.left });
                        }}
                        disabled={savingStatusId === s.id}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors disabled:opacity-70 ${st.badge}`}
                      >
                        {savingStatusId === s.id ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : (
                          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                        )}
                        {st.label}
                        <ChevronDown size={10} className="ml-0.5 opacity-60" />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          title="Edit sermon"
                          onClick={() => router.push(`/dashboard/pastor/sermons/${s.id}/edit`)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          title="Delete sermon"
                          onClick={() => setDeleteTarget(s)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                        <button
                          type="button"
                          title="More"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 dark:text-gray-600 cursor-default"
                        >
                          <MoreVertical size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Status dropdown — fixed to viewport so it never affects table height ── */}
      {statusMenu && (() => {
        const current = rows.find((r) => r.id === statusMenu.id);
        const currentStatus = current && (current.status as SermonStatus) in STATUS_STYLE
          ? (current.status as SermonStatus)
          : null;
        return (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setStatusMenu(null)} />
            <div
              className="fixed z-50 w-36 rounded-xl border border-gray-100 dark:border-white/10 bg-white dark:bg-[#242426] shadow-lg py-1"
              style={{ top: statusMenu.top, left: statusMenu.left }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => changeStatus(statusMenu.id, opt)}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-semibold transition-colors ${
                    opt === currentStatus
                      ? 'text-gray-900 dark:text-white bg-gray-50 dark:bg-white/5'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_STYLE[opt].dot}`} />
                  {STATUS_STYLE[opt].label}
                  {opt === currentStatus && <Check size={11} className="ml-auto" />}
                </button>
              ))}
            </div>
          </>
        );
      })()}

      {/* ── Delete confirmation ────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => !deleteSermon.isPending && setDeleteTarget(null)}>
          <div
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-white/10 p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10 mb-3">
              <Trash2 size={16} className="text-red-500" />
            </div>
            <h3 className="font-sans text-sm font-bold text-gray-900 dark:text-white">
              Delete this sermon?
            </h3>
            <p className="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
              &quot;{deleteTarget.title}&quot; will be permanently removed. This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteSermon.isPending}
                className="font-sans rounded-lg border border-gray-200 dark:border-white/10 px-3.5 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteSermon.isPending}
                className="font-sans inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-700 active:scale-[0.97] transition-all disabled:opacity-60"
              >
                {deleteSermon.isPending && <Loader2 size={12} className="animate-spin" />}
                {deleteSermon.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
