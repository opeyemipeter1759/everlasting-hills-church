import Link from "next/link";
import { ArrowRight, HandCoins, Mic2, Radio, Video } from "lucide-react";

export default function PledgeProjectSection() {
  return (
    <section className="relative isolate overflow-hidden bg-[#4a0719] py-20 text-white sm:py-24">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_30%,rgba(242,184,75,0.34),transparent_34%),linear-gradient(120deg,#26030d,#87102c)]"
      />
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 xs:px-5 sm:px-8 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-[#f2b84b] px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em] xs:tracking-[0.16em] text-[#3a0612]">
            <HandCoins size={15} aria-hidden="true" /> Sacrificial giving
          </p>
          <h2 className="mt-5 max-w-3xl text-3xl font-black leading-tight tracking-tight [text-wrap:balance] sm:text-5xl">
            Help strengthen our Sound &amp; Media Project.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/80">
            Members, friends, partners and visitors can pledge towards better sound, recording, streaming and media facilities for worship and ministry.
          </p>
          <ul className="mt-5 flex flex-wrap gap-4 text-sm font-semibold text-white/85">
            <li className="inline-flex items-center gap-1.5"><Mic2 size={15} aria-hidden="true" /> Sound</li>
            <li className="inline-flex items-center gap-1.5"><Video size={15} aria-hidden="true" /> Recording</li>
            <li className="inline-flex items-center gap-1.5"><Radio size={15} aria-hidden="true" /> Streaming</li>
          </ul>
        </div>
        <Link
          href="/pledge"
          className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#f2b84b] px-7 text-lg font-black text-[#3a0612] shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:bg-[#ffc85e] lg:w-auto"
        >
          Make a pledge <ArrowRight size={20} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
