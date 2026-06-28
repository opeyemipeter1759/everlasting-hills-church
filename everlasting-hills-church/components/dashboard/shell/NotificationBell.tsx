"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/axios";

interface Notification {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  type: string;
  readAt: string | null;
  createdAt: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  // Unread count — polled so the badge stays fresh without a websocket.
  const { data: countData } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const res = await apiClient.get<{ count: number }>("/notifications/unread-count");
      return res.data;
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  const unread = countData?.count ?? 0;

  // Full list — only fetched while the panel is open.
  const { data: items = [] } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: async () => {
      const res = await apiClient.get<Notification[]>("/notifications");
      return res.data;
    },
    enabled: open,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAll = useMutation({
    mutationFn: () => apiClient.post("/notifications/read-all"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Close on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.07] transition-colors text-gray-500 dark:text-white/50"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#87102C] text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[70vh] overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#140b10] shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/[0.07]">
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              Notifications
            </p>
            {unread > 0 && (
              <button
                onClick={() => markAll.mutate()}
                className="text-xs font-semibold text-[#87102C] dark:text-church-accent hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-gray-400 dark:text-white/40">
                You are all caught up.
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    if (!n.readAt) markRead.mutate(n.id);
                    if (n.link) window.location.href = n.link;
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 dark:border-white/[0.04] hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors ${
                    n.readAt ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.readAt && (
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-[#87102C] dark:bg-church-accent flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-xs text-gray-500 dark:text-white/50 line-clamp-2 mt-0.5">
                          {n.body}
                        </p>
                      )}
                      <p className="text-[11px] text-gray-400 dark:text-white/30 mt-1">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                    {n.readAt && (
                      <Check size={14} className="text-gray-300 dark:text-white/20 flex-shrink-0 mt-1" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
