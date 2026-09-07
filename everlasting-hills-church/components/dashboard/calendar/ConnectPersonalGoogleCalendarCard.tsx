"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { CheckCircle2, RefreshCw, UserRound } from "lucide-react";
import {
  useConnectGoogleCalendar,
  useDisconnectGoogleCalendar,
  useGoogleCalendarStatus,
  useSyncGoogleCalendar,
} from "@/lib/api/google-calendar";

export default function ConnectPersonalGoogleCalendarCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: status, isLoading } = useGoogleCalendarStatus();
  const connect = useConnectGoogleCalendar();
  const disconnect = useDisconnectGoogleCalendar();
  const sync = useSyncGoogleCalendar();
  const handledRedirect = useRef(false);
  const autoSynced = useRef(false);

  useEffect(() => {
    const result = searchParams.get("google");
    if (!result || handledRedirect.current) return;
    handledRedirect.current = true;

    if (result === "connected") {
      toast.success("Google Calendar connected!");
    } else if (result === "error") {
      toast.error("We couldn't connect your Google Calendar. Please try again.");
    }
    router.replace("/dashboard/calendar");
  }, [searchParams, router]);

  // Keeps the sync feeling automatic: a member who is already connected
  // doesn't have to remember to press "Sync now" every time they check —
  // visiting the page is enough. Runs once per visit; the periodic backend
  // job covers freshness the rest of the time. Silent on purpose — a toast
  // every single page load would get old fast.
  useEffect(() => {
    if (!status?.connected || autoSynced.current) return;
    autoSynced.current = true;
    sync.mutate();
  }, [status?.connected, sync]);

  async function handleConnect() {
    try {
      const { url } = await connect.mutateAsync();
      window.location.href = url;
    } catch {
      toast.error("We couldn't start the connection. Please try again.");
    }
  }

  async function handleDisconnect() {
    try {
      await disconnect.mutateAsync();
      toast.success("Google Calendar disconnected");
    } catch {
      toast.error("We couldn't disconnect. Please try again.");
    }
  }

  async function handleSync() {
    try {
      const result = await sync.mutateAsync();
      toast.success(`Synced ${result.synced} item${result.synced === 1 ? "" : "s"} to your Google Calendar`);
    } catch {
      toast.error("We couldn't sync right now. Please try again.");
    }
  }

  return (
    <div className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl shadow-[0_1px_2px_rgba(135,16,44,0.04)] dark:shadow-none px-6 sm:px-8 py-7">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF4F6] dark:bg-white/[0.06] text-[#87102C] dark:text-[#FFB3C1]">
          <UserRound className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-bold text-[#111] dark:text-white">
            Your personal Google Calendar
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-[#8a7e80] dark:text-white/50">
            Connecting does two things: your own Google Calendar events show up here, and church
            services, events and gatherings get pushed into a new &ldquo;Everlasting Hills
            Church&rdquo; calendar in your Google account — kept in sync automatically from then on.
          </p>

          <div className="mt-4">
            {isLoading ? (
              <p className="text-sm text-[#8a7e80] dark:text-white/45">Loading...</p>
            ) : status?.connected ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-1.5 text-[12.5px] font-semibold text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Connected{status.googleEmail ? ` as ${status.googleEmail}` : ""}
                </span>
                <button
                  type="button"
                  onClick={handleSync}
                  disabled={sync.isPending}
                  className="flex items-center gap-1.5 rounded-xl border border-[#E7CDD3] px-3.5 py-2 text-[12.5px] font-semibold text-[#5A4A4D] transition-colors hover:bg-[#FFF4F6] disabled:opacity-50 dark:border-white/[0.14] dark:text-white/70 dark:hover:bg-white/[0.07]"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${sync.isPending ? "animate-spin" : ""}`} />
                  {sync.isPending ? "Syncing..." : "Sync now"}
                </button>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={disconnect.isPending}
                  className="rounded-xl border border-[#E7CDD3] px-3.5 py-2 text-[12.5px] font-semibold text-[#5A4A4D] transition-colors hover:bg-[#FFF4F6] disabled:opacity-50 dark:border-white/[0.14] dark:text-white/70 dark:hover:bg-white/[0.07]"
                >
                  {disconnect.isPending ? "Disconnecting..." : "Disconnect"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                disabled={connect.isPending}
                className="rounded-xl bg-[#87102C] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6E0C24] disabled:opacity-50"
              >
                {connect.isPending ? "Connecting..." : "Connect Google Calendar"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
