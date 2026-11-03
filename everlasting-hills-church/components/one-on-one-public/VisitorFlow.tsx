"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import Loader from "@/components/ui/feedback/Loader";
import { useIsLoggedIn } from "@/components/home/NavUserBadge";
import type { HostSummary } from "@/lib/api/one-on-one";
import { usePublicHosts, usePublicIntake } from "@/lib/api/one-on-one-public";
import { errorText } from "@/components/pray-watch/shared";
import { HostCard } from "@/components/dashboard/one-on-one/member/OneOnOneScreen";
import BookingPanel from "@/components/dashboard/one-on-one/member/BookingPanel";
import HostProfile from "@/components/dashboard/one-on-one/member/HostProfile";
import { browserTimeZone } from "@/components/dashboard/one-on-one/member/parts";
import VisitorRequestForm from "./VisitorRequestForm";

type Step =
  | { kind: "pick" }
  | { kind: "time"; typeId: string }
  | { kind: "details"; typeId: string; slot: { startsAt: string; endsAt: string } }
  | { kind: "sent"; email: string };

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[30vh] items-center justify-center">{children}</div>;
}

/**
 * The public request flow, for one pastor at a time.
 *
 * Without a `slug` it is the general page: it names no one, uses the
 * receiving pastor's sessions and hours, and the request lands with them to
 * pass on. With a `slug` (a pastor's share link) it shows that pastor's
 * sessions; with a `sessionSlug` too it opens that session's calendar.
 * Signed-in members go to their dashboard instead, where they're known.
 */
export default function VisitorFlow({ slug, sessionSlug }: { slug?: string; sessionSlug?: string }) {
  const router = useRouter();
  const loggedIn = useIsLoggedIn();
  const intake = usePublicIntake();
  const hosts = usePublicHosts();
  const [step, setStep] = useState<Step>({ kind: "pick" });
  const [timeZone, setTimeZone] = useState("Africa/Lagos");
  useEffect(() => setTimeZone(browserTimeZone()), []);

  useEffect(() => {
    if (!loggedIn) return;
    const params = new URLSearchParams();
    if (slug) params.set("host", slug);
    if (sessionSlug) params.set("session", sessionSlug);
    const query = params.toString();
    router.replace(`/dashboard/one-on-one${query ? `?${query}` : ""}`);
  }, [loggedIn, router, slug, sessionSlug]);

  const anonymous = !slug;
  const source = anonymous ? intake : hosts;
  const host: HostSummary | null | undefined = anonymous ? intake.data : hosts.data?.find((h) => h.slug === slug);

  // A session's own link opens its calendar directly.
  useEffect(() => {
    if (!host || !sessionSlug || step.kind !== "pick") return;
    const type = host.sessionTypes.find((t) => t.slug === sessionSlug);
    if (type) setStep({ kind: "time", typeId: type.id });
    // Only on arrival; "back" should show the list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [host?.id, sessionSlug]);

  if (loggedIn !== false || source.isLoading) {
    return (
      <Centered>
        <Loader />
      </Centered>
    );
  }
  if (source.isError) return <p className="text-sm font-semibold text-red-700">{errorText(source.error, "Couldn’t load this page. Please refresh.")}</p>;

  if (!host) {
    return (
      <div className="flex max-w-xl flex-col gap-4 rounded-2xl border border-[#E7CDD3]/60 bg-white p-6 text-[15px] text-[#3B2A2E] dark:border-white/[0.09] dark:bg-white/[0.05] dark:text-white/80">
        <p>
          {anonymous
            ? "Our pastors aren’t taking new requests from this page right now. Please check back soon, or reach the church office through the contact page."
            : "This pastor isn’t taking requests through this link right now."}
        </p>
        {!anonymous && (
          <Link href="/talk-to-a-pastor" className="font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]">
            Request time with one of our pastors →
          </Link>
        )}
      </div>
    );
  }

  if (step.kind === "sent") {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-start gap-4 rounded-2xl border border-[#E7CDD3]/60 bg-white p-8 dark:border-white/[0.09] dark:bg-white/[0.05]">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFE8ED] text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#FFB3C1]">
          <MailCheck size={22} aria-hidden="true" />
        </span>
        <h2 className="font-serif text-3xl font-bold text-[#111] dark:text-white">Check your email</h2>
        <p className="text-[15px] text-[#3B2A2E] dark:text-white/80">
          We’ve sent a link to <strong className="break-all">{step.email}</strong>. Tap it within 30 minutes to confirm your request, and it will reach{" "}
          {anonymous ? "our pastors" : host.displayName}. If it doesn’t arrive in a few minutes, check your spam folder.
        </p>
        <p className="text-sm text-[#7A6A6F] dark:text-white/55">The same link lets you see, change or withdraw your request later, so keep the email.</p>
      </div>
    );
  }

  if (step.kind === "time") {
    return (
      <BookingPanel
        host={host}
        hostIndex={0}
        sessionTypeId={step.typeId}
        audience="visitor"
        timeZone={timeZone}
        anonymous={anonymous}
        backLabel="All sessions"
        onBack={() => setStep({ kind: "pick" })}
        onNext={(slot) => setStep({ kind: "details", typeId: step.typeId, slot })}
      />
    );
  }

  if (step.kind === "details") {
    return (
      <div className="max-w-2xl">
        <VisitorRequestForm
          host={host}
          sessionTypeId={step.typeId}
          slot={step.slot}
          timeZone={timeZone}
          viaIntake={anonymous}
          onBack={() => setStep({ kind: "time", typeId: step.typeId })}
          onSent={(email) => setStep({ kind: "sent", email })}
        />
      </div>
    );
  }

  if (anonymous) {
    return (
      <div className="max-w-xl">
        <HostCard host={host} index={0} anonymous onChoose={(typeId) => setStep({ kind: "time", typeId })} />
      </div>
    );
  }
  return <HostProfile host={host} index={0} onChoose={(typeId) => setStep({ kind: "time", typeId })} />;
}
