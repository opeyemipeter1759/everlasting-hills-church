"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen, Plus, Edit2, Trash2, Star, Eye,
  Clock, CheckCircle2, FileText, ChevronRight,
} from "lucide-react";

type Sermon = {
  id: string;
  title: string;
  slug: string;
  speaker: string;
  date: string;
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED";
  isFeatured: boolean;
  playCount: number;
  scriptureRef: string | null;
  series: string | null;
  _count: { reactions: number; bookmarks: number };
};

const STATUS_STYLE: Record<string, string> = {
  PUBLISHED: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  DRAFT:     "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400",
  SCHEDULED: "bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400",
};
const STATUS_ICON: Record<string, React.ReactNode> = {
  PUBLISHED: <CheckCircle2 size={10} />,
  DRAFT:     <FileText size={10} />,
  SCHEDULED: <Clock size={10} />,
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function SermonList({ sermons: initial }: { sermons: Sermon[] }) {
  const router = useRouter();
  const [sermons, setSermons] = useState(initial);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this sermon? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await fetch(`/api/sermons/${id}`, { method: "DELETE" });
      setSermons((prev) => prev.filter((s) => s.id !== id));
    } finally { setDeleting(null); }
  }

  async function handleFeature(id: string) {
    await fetch(`/api/sermons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setFeatured: true }),
    });
    setSermons((prev) => prev.map((s) => ({ ...s, isFeatured: s.id === id })));
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Sermons</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{sermons.length} sermon{sermons.length !== 1 ? "s" : ""} total</p>
        </div>
        <Link href="/dashboard/sermons/new"
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-[#87102C] text-white hover:bg-[#6E0C24] transition-colors">
          <Plus size={15} /> New Sermon
        </Link>
      </div>

      {sermons.length === 0 ? (
        <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <BookOpen size={32} className="text-gray-200 dark:text-gray-700 mb-3" />
          <p className="text-sm font-medium text-gray-400 dark:text-gray-500">No sermons yet.</p>
          <Link href="/dashboard/sermons/new"
            className="mt-4 text-sm font-semibold text-[#87102C] dark:text-[#e8768a] hover:underline">
            Create your first sermon →
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-white/8">
            {sermons.map((s) => (
              <div key={s.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/70 dark:hover:bg-white/[0.03] transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-[#87102C]/10 dark:bg-[#87102C]/20 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={16} className="text-[#87102C] dark:text-[#e8768a]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight truncate">
                      {s.title}
                    </p>
                    {s.isFeatured && (
                      <Star size={12} className="text-amber-500 flex-shrink-0" fill="currentColor" title="Featured" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {s.speaker} · {fmtDate(s.date)}
                    {s.scriptureRef && ` · ${s.scriptureRef}`}
                    {s.series && ` · ${s.series}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                    <Eye size={11} /><span>{s.playCount}</span>
                  </div>
                  <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[s.status]}`}>
                    {STATUS_ICON[s.status]}{s.status.charAt(0) + s.status.slice(1).toLowerCase()}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!s.isFeatured && s.status === "PUBLISHED" && (
                      <button type="button" onClick={() => handleFeature(s.id)} title="Set as featured"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors">
                        <Star size={13} />
                      </button>
                    )}
                    <Link href={`/sermons/${s.slug}`} target="_blank" title="Preview"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-colors">
                      <Eye size={13} />
                    </Link>
                    <Link href={`/dashboard/sermons/${s.id}/edit`} title="Edit"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-[#87102C] hover:bg-[#87102C]/5 transition-colors">
                      <Edit2 size={13} />
                    </Link>
                    <button type="button" onClick={() => handleDelete(s.id)}
                      disabled={deleting === s.id} title="Delete"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
