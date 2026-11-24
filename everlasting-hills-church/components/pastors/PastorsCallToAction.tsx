import Link from "next/link";
import { ArrowRight, BookOpen, MessageCircle, Users } from "lucide-react";

export default function PastorsCallToAction() {
  return (
    <section className="relative overflow-hidden bg-[#0c0608] py-20 text-white sm:py-24">
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-[#87102C]/30 blur-[140px]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 xs:px-6 sm:px-8 md:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">Come as you are</p>
          <h2 className="mt-3 text-balance font-serif text-3xl font-normal tracking-tight sm:text-4xl">
            There is a place for you at EHC
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-white/55">
            Our pastors would love to meet you. Join us this Sunday, or reach out — every newcomer is welcomed as
            family.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <CtaCard href="/visit" icon={Users} title="Plan a visit" text="Know what to expect on Sunday." primary />
          <CtaCard
            href="/talk-to-a-pastor"
            icon={MessageCircle}
            title="Talk to a pastor"
            text="Book a one-on-one session."
          />
          <CtaCard
            href="/sermons"
            icon={BookOpen}
            title="Listen to sermons"
            text="Catch up on recent messages."
            className="sm:col-span-2"
          />
        </div>
      </div>
    </section>
  );
}

function CtaCard({
  href,
  icon: Icon,
  title,
  text,
  primary,
  className = "",
}: {
  href: string;
  icon: typeof Users;
  title: string;
  text: string;
  primary?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-4 rounded-2xl border p-5 transition-colors ${
        primary
          ? "border-[#87102C] bg-[#87102C] hover:bg-[#6E0C24]"
          : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.08]"
      } ${className}`}
    >
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-white/60">{text}</span>
      </span>
      <ArrowRight size={16} className="flex-shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
