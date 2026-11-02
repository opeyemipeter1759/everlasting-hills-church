"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Loader from "@/components/ui/feedback/Loader";
import { useHosts, useManageContext, useMyRequests, type HostSummary } from "@/lib/api/one-on-one";
import { errorText } from "@/components/pray-watch/shared";
import { btnGhost, durationLabel, formatTime } from "../manage/ui";
import AppointmentCard from "./AppointmentCard";
import BookingPanel from "./BookingPanel";
import RequestForm from "./RequestForm";
import { Portrait, StatusPill, formatWhenLong, isOpen, pastorsOf } from "./parts";

type Step =
  | { kind: "pick" }
  | { kind: "time"; hostId: string; typeId: string }
  | { kind: "details"; hostId: string; typeId: string; slot: { startsAt: string; endsAt: string } };

function nextOpeningLabel(iso: string | null): string {
  if (!iso) return "No open times right now";
  const day = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", weekday: "short", day: "numeric", month: "short" }).format(new Date(iso));
  return `Next opening ${day}, ${formatTime(iso)}`;
}

export function HostCard({ host, index, onChoose }: { host: HostSummary; index: number; onChoose: (typeId: string) => void }) {
  const joint = host.sessionTypes.some((t) => t.joint);
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-[#E7CDD3]/60 bg-white p-6 shadow-[0_1px_3px_rgba(135,16,44,0.04)] dark:border-white/[0.09] dark:bg-white/[0.05] dark:shadow-none">
      <Portrait name={host.displayName} index={index} size="lg" />
      <div>
        <h2 className="font-serif text-[22px] font-bold leading-tight text-[#111] dark:text-white">{host.displayName}</h2>
        {host.title && <p className="text-sm text-[#7A6A6F] dark:text-white/55">{host.title}</p>}
      </div>
      {host.bio && <p className="text-sm text-[#7A6A6F] dark:text-white/60">{host.bio}</p>}
      <div className="flex flex-col gap-2">
        {host.sessionTypes.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChoose(t.id)}
            className="flex items-center justify-between gap-3 rounded-xl border border-[#E7CDD3] px-3.5 py-2.5 text-left text-sm font-semibold text-[#111] transition hover:border-[#87102C] hover:bg-[#FFE8ED]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#87102C] dark:border-white/10 dark:text-white dark:hover:bg-white/[0.06]"
          >
            <span>
              {t.name}
              {t.joint && <span className="block text-xs font-medium text-[#7A6A6F] dark:text-white/50">With both pastors</span>}
            </span>
            <span className="whitespace-nowrap font-medium tabular-nums text-[#7A6A6F] dark:text-white/55">{durationLabel(t.durationMinutes)}</span>
          </button>
        ))}
      </div>
      <p className={`flex items-center gap-1.5 text-[13px] font-semibold ${host.nextOpening ? "text-emerald-700 dark:text-emerald-300" : "text-[#7A6A6F] dark:text-white/50"}`}>
        {host.nextOpening && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />}
        {nextOpeningLabel(host.nextOpening)}
        {joint && host.nextOpening && <span className="sr-only">, for one-on-one sessions</span>}
      </p>
    </article>
  );
}

export default function OneOnOneScreen() {
  const hosts = useHosts();
  const mine = useMyRequests();
  const manage = useManageContext();
  const [step, setStep] = useState<Step>({ kind: "pick" });
  const searchParams = useSearchParams();
  const wanted = searchParams.get("host");
  const [usedLink, setUsedLink] = useState(false);

  const requests = mine.data ?? [];
  const open = requests.find((r) => isOpen(r));

  // Arriving from a pastor's share link goes straight to their calendar.
  useEffect(() => {
    if (usedLink || !wanted || !hosts.data || !mine.data) return;
    setUsedLink(true);
    const host = hosts.data.find((h) => h.slug === wanted || h.id === wanted);
    if (host && !open && host.sessionTypes[0]) setStep({ kind: "time", hostId: host.id, typeId: host.sessionTypes[0].id });
  }, [usedLink, wanted, hosts.data, mine.data, open]);
  const history = requests.filter((r) => r !== open);
  const canManage = (manage.data?.hosts.length ?? 0) > 0 || manage.data?.canSetUp;

  const hostList = hosts.data ?? [];
  const hostIndex = (id: string) => Math.max(0, hostList.findIndex((h) => h.id === id));
  const findHost = (id: string) => hostList.find((h) => h.id === id);

  let main: React.ReactNode;
  if (hosts.isLoading || mine.isLoading) {
    main = (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Loader />
      </div>
    );
  } else if (hosts.isError || mine.isError) {
    main = <p className="text-sm font-semibold text-red-700 dark:text-red-300">{errorText(hosts.error ?? mine.error, "Couldn’t load One-on-One.")}</p>;
  } else if (open && step.kind === "pick") {
    main = (
      <div className="flex max-w-xl flex-col gap-3">
        <AppointmentCard request={open} onPickAnother={() => setStep({ kind: "time", hostId: open.hostId, typeId: open.sessionTypeId })} />
        <p className="text-sm text-[#7A6A6F] dark:text-white/55">You can request another session once this one has happened.</p>
      </div>
    );
  } else if (step.kind === "time" && findHost(step.hostId)) {
    const host = findHost(step.hostId)!;
    main = (
      <BookingPanel
        host={host}
        hostIndex={hostIndex(host.id)}
        sessionTypeId={step.typeId}
        onBack={() => setStep({ kind: "pick" })}
        onNext={(slot) => setStep({ kind: "details", hostId: host.id, typeId: step.typeId, slot })}
      />
    );
  } else if (step.kind === "details" && findHost(step.hostId)) {
    const host = findHost(step.hostId)!;
    main = (
      <RequestForm
        host={host}
        sessionTypeId={step.typeId}
        slot={step.slot}
        onBack={() => setStep({ kind: "time", hostId: host.id, typeId: step.typeId })}
        onSent={() => setStep({ kind: "pick" })}
      />
    );
  } else if (hostList.length === 0) {
    main = (
      <p className="max-w-xl rounded-2xl border border-[#E7CDD3]/60 bg-white p-6 text-sm text-[#7A6A6F] dark:border-white/[0.09] dark:bg-white/[0.05] dark:text-white/55">
        The pastors aren’t taking one-on-one requests right now. Please check back soon.
      </p>
    );
  } else {
    main = (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {hostList.map((h, i) => (
          <HostCard key={h.id} host={h} index={i} onChoose={(typeId) => setStep({ kind: "time", hostId: h.id, typeId })} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex max-w-full flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#111] dark:text-white sm:text-4xl">Book time with a pastor</h1>
          <p className="mt-1 text-sm text-[#7A6A6F] dark:text-white/55">One-on-one sessions for counsel, prayer and conversation.</p>
        </div>
        {canManage && (
          <Link href="/dashboard/one-on-one/manage" className={btnGhost}>
            Manage sessions
          </Link>
        )}
      </header>

      {main}

      {history.length > 0 && step.kind === "pick" && (
        <section aria-labelledby="history-title" className="flex max-w-3xl flex-col gap-3">
          <h2 id="history-title" className="text-sm font-bold text-[#111] dark:text-white">
            Your sessions
          </h2>
          <ul className="divide-y divide-[#E7CDD3]/50 overflow-hidden rounded-2xl border border-[#E7CDD3]/60 bg-white dark:divide-white/[0.07] dark:border-white/[0.09] dark:bg-white/[0.05]">
            {history.map((r) => (
              <li key={r.id} className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3 px-4 py-3 sm:grid-cols-[3.5rem_minmax(0,1fr)_auto]">
                <span className="rounded-xl border border-[#E7CDD3] py-1 text-center leading-tight dark:border-white/10">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[#87102C] dark:text-[#FFB3C1]">
                    {new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", month: "short" }).format(new Date(r.startsAt))}
                  </span>
                  <span className="block text-lg font-bold tabular-nums text-[#111] dark:text-white">
                    {new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", day: "2-digit" }).format(new Date(r.startsAt))}
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-[#111] dark:text-white">{pastorsOf(r)}</span>
                  <span className="block truncate text-xs text-[#7A6A6F] dark:text-white/55">
                    {formatWhenLong(r.startsAt, r.endsAt).split(", ")[1]} · {r.sessionTypeName}
                  </span>
                </span>
                <span className="col-start-2 sm:col-start-auto">
                  <StatusPill request={r} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
