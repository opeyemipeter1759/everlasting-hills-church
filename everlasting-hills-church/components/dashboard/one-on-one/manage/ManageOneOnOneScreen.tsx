"use client";

import { useEffect, useMemo, useState } from "react";
import Loader from "@/components/ui/feedback/Loader";
import { useHostDetail, useHosts, useManageContext, useSetUpMyHost, type HostAccess } from "@/lib/api/one-on-one";
import { showToast } from "@/components/ui/toast/toast";
import { errorText } from "@/components/pray-watch/shared";
import WeeklyHoursCard from "./WeeklyHoursCard";
import DaysOffCard from "./DaysOffCard";
import ProfileRulesCard from "./ProfileRulesCard";
import SessionTypesCard from "./SessionTypesCard";
import DelegatesCard from "./DelegatesCard";
import PreviewCard from "./PreviewCard";
import { btnPrimary, muted } from "./ui";

const ACCESS_NOTE: Record<HostAccess, string | null> = {
  OWNER: null,
  DELEGATE: "You're managing these sessions as a delegate.",
  SUPER_ADMIN: "You're managing these sessions as Super Admin.",
};

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[40vh] items-center justify-center px-4 text-center">{children}</div>;
}

export default function ManageOneOnOneScreen() {
  const context = useManageContext();
  const setUp = useSetUpMyHost();
  const hosts = useMemo(() => context.data?.hosts ?? [], [context.data]);
  const [hostId, setHostId] = useState<string | null>(null);

  useEffect(() => {
    if (hosts.length && !hosts.some((h) => h.hostId === hostId)) setHostId(hosts[0].hostId);
  }, [hosts, hostId]);

  const detail = useHostDetail(hostId);
  const allHosts = useHosts();
  const current = hosts.find((h) => h.hostId === hostId);
  const otherHosts = (allHosts.data ?? []).filter((h) => h.id !== hostId).map((h) => ({ hostId: h.id, displayName: h.displayName }));

  async function onSetUp() {
    try {
      const host = await setUp.mutateAsync();
      setHostId(host.id);
      showToast.success("One-on-One is on. Add your weekly hours next.");
    } catch (err) {
      showToast.error(errorText(err, "Couldn't set up One-on-One."));
    }
  }

  if (context.isLoading) {
    return (
      <Centered>
        <Loader />
      </Centered>
    );
  }
  if (context.isError) {
    return (
      <Centered>
        <p className="text-sm font-semibold text-red-700 dark:text-red-300">{errorText(context.error, "Couldn't load One-on-One.")}</p>
      </Centered>
    );
  }

  const header = (
    <header className="flex flex-col gap-1">
      <h1 className="font-serif text-3xl font-bold text-[#111] dark:text-white">One-on-One</h1>
      <p className={`text-sm ${muted}`}>Your hours, the rules for requests, and who helps you manage them.</p>
    </header>
  );

  if (hosts.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        {header}
        <div className="rounded-2xl border border-[#E7CDD3]/60 bg-white p-8 dark:border-white/[0.09] dark:bg-white/[0.05]">
          {context.data?.canSetUp ? (
            <div className="flex flex-col items-start gap-4">
              <h2 className="font-serif text-2xl font-bold text-[#111] dark:text-white">Start taking one-on-one sessions</h2>
              <p className={`text-sm ${muted}`}>
                Members, and visitors who’ve found the messages online, will be able to request a 1- or 2-hour session with you. Nothing
                is booked until you, or someone you appoint, approves it. You’ll set your weekly hours next.
              </p>
              <button type="button" className={btnPrimary} onClick={onSetUp} disabled={setUp.isPending}>
                {setUp.isPending ? "Setting up…" : "Turn on One-on-One"}
              </button>
            </div>
          ) : (
            <p className={`text-sm ${muted}`}>
              You aren’t managing any pastor’s sessions. If a pastor has asked you to help with their schedule, ask them to add you as a
              delegate.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex max-w-full flex-col gap-6">
      {header}

      {hosts.length > 1 && (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Pastor">
          {hosts.map((h) => (
            <button
              key={h.hostId}
              type="button"
              role="tab"
              aria-selected={h.hostId === hostId}
              onClick={() => setHostId(h.hostId)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                h.hostId === hostId
                  ? "border-[#87102C] bg-[#FFE8ED] text-[#87102C] dark:bg-[#87102C]/30 dark:text-[#FFB3C1]"
                  : "border-[#E7CDD3] text-[#5A4A4D] hover:bg-[#FFE8ED]/50 dark:border-white/10 dark:text-white/70"
              }`}
            >
              {h.displayName}
            </button>
          ))}
          {context.data?.canSetUp && (
            <button type="button" onClick={onSetUp} disabled={setUp.isPending} className="rounded-full border border-dashed border-[#E7CDD3] px-4 py-1.5 text-sm font-semibold text-[#87102C] dark:border-white/15 dark:text-[#FFB3C1]">
              + Take sessions myself
            </button>
          )}
        </div>
      )}

      {current && ACCESS_NOTE[current.access] && <p className={`-mt-2 text-sm ${muted}`}>{ACCESS_NOTE[current.access]}</p>}

      {detail.isLoading || !detail.data ? (
        <Centered>{detail.isError ? <p className="text-sm text-red-700">{errorText(detail.error)}</p> : <Loader />}</Centered>
      ) : (
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-5">
            <WeeklyHoursCard host={detail.data} />
            <DaysOffCard host={detail.data} />
            <PreviewCard host={detail.data} />
          </div>
          <div className="flex min-w-0 flex-col gap-5">
            <ProfileRulesCard host={detail.data} />
            <SessionTypesCard host={detail.data} otherHosts={otherHosts} />
            <DelegatesCard host={detail.data} />
          </div>
        </div>
      )}
    </div>
  );
}
