"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Send, Users, Mail, Check } from "lucide-react";
import { apiClient } from "@/lib/api/axios";

interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: string;
  sendEmail: boolean;
  recipients: number;
  createdAt: string;
}

export default function AnnouncementsClient() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [justSent, setJustSent] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const res = await apiClient.get<Announcement[]>("/announcements");
      return res.data;
    },
  });

  const create = useMutation({
    mutationFn: () =>
      apiClient.post("/announcements", { title, body, sendEmail, audience: "all" }),
    onSuccess: () => {
      setTitle("");
      setBody("");
      setSendEmail(false);
      setJustSent(true);
      setTimeout(() => setJustSent(false), 3000);
      qc.invalidateQueries({ queryKey: ["announcements"] });
      // Recipients will also see it in their bell.
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const canSend = title.trim().length >= 3 && body.trim().length >= 3 && !create.isPending;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Composer */}
      <section className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#140b10] p-6">
        <div className="flex items-center gap-2 mb-5">
          <Megaphone size={18} className="text-[#87102C] dark:text-church-accent" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            New Announcement
          </h2>
        </div>

        <div className="space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            maxLength={140}
            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#87102C]/40"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message to the church family..."
            rows={5}
            maxLength={4000}
            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#87102C]/40 resize-y"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/60 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="rounded border-gray-300 text-[#87102C] focus:ring-[#87102C]"
              />
              <Mail size={14} />
              Also send by email
            </label>

            <button
              onClick={() => create.mutate()}
              disabled={!canSend}
              className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#6E0C24] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {justSent ? <Check size={16} /> : <Send size={16} />}
              {create.isPending ? "Sending..." : justSent ? "Sent" : "Publish"}
            </button>
          </div>

          {create.isError && (
            <p className="text-sm text-red-500">
              Could not publish. Check your inputs and try again.
            </p>
          )}
        </div>
      </section>

      {/* History */}
      <section>
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 dark:text-white/40 mb-4">
          Past Announcements
        </h3>
        {isLoading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-white/40">
            No announcements yet.
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((a) => (
              <div
                key={a.id}
                className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#140b10] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {a.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-white/50 mt-1 whitespace-pre-wrap">
                      {a.body}
                    </p>
                  </div>
                  <span className="text-[11px] text-gray-400 dark:text-white/30 flex-shrink-0">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-3 text-[11px] text-gray-400 dark:text-white/30">
                  <span className="inline-flex items-center gap-1">
                    <Users size={12} />
                    {a.recipients} recipient{a.recipients === 1 ? "" : "s"}
                  </span>
                  {a.sendEmail && (
                    <span className="inline-flex items-center gap-1">
                      <Mail size={12} />
                      Emailed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
