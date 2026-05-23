"use client";

import { useState } from "react";
import { Mail, Trash2, Download } from "lucide-react";

type Subscriber = {
  id: string;
  email: string;
  subscribedAt: string;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function SubscriberList({ subscribers }: { subscribers: Subscriber[] }) {
  const [list, setList] = useState(subscribers);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = list.filter((s) =>
    s.email.toLowerCase().includes(search.toLowerCase().trim())
  );

  async function handleDelete(id: string, email: string) {
    if (!confirm(`Remove ${email} from the subscriber list?`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/sermons/subscribe?id=${id}`, { method: "DELETE" });
      if (res.ok) setList((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  function downloadCsv() {
    const rows = [["Email", "Subscribed At"], ...list.map((s) => [s.email, fmtDate(s.subscribedAt)])];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sermon-subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Sermon Subscribers</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {list.length} subscriber{list.length !== 1 ? "s" : ""} — email notifications for new sermons
          </p>
        </div>
        <button
          type="button"
          onClick={downloadCsv}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-[#87102C]/40 transition-all"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by email…"
        className="w-full max-w-sm text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] text-gray-700 dark:text-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all"
      />

      {/* Table */}
      <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Mail size={32} className="text-gray-200 dark:text-gray-700 mb-3" />
            <p className="text-gray-400 dark:text-gray-500">
              {search ? "No subscribers match your search." : "No subscribers yet."}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/8">
                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Email</th>
                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 hidden sm:table-cell">Subscribed</th>
                <th className="px-5 py-3 w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/8">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-800 dark:text-gray-200">{s.email}</td>
                  <td className="px-5 py-3.5 text-gray-400 dark:text-gray-500 hidden sm:table-cell">{fmtDate(s.subscribedAt)}</td>
                  <td className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => handleDelete(s.id, s.email)}
                      disabled={deleting === s.id}
                      className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                      title="Remove subscriber"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
