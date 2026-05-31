import Image from "next/image";
import { ShieldCheck } from "lucide-react";

interface AuthSplitScreenProps {
  /** Right-panel form content. Already-padded; the wrapper supplies bg + sizing. */
  children: React.ReactNode;
  /** Optional override for the left-panel scripture verse. */
  scripture?: string;
  scriptureRef?: string;
  /** Optional override for the supporting copy under the scripture. */
  supportingCopy?: string;
}

/**
 * Shared split-screen shell for /login, /register, /change-password, /forgot-password.
 *
 * Why a shared component: the left panel (logo, scripture, trust badge) is identical across
 * every auth screen. Duplicating it per page would make the visual language drift the moment
 * one page is updated and others are not.
 *
 * Anatomy:
 *   LEFT (lg+ only)  — dark burgundy gradient. Logo, Genesis 49:26 scripture, trust badge.
 *   RIGHT             — white card. Page-specific form supplied as `children`.
 */
export default function AuthSplitScreen({
  children,
  scripture = "The blessings of your father have surpassed the blessings of the everlasting hills.",
  scriptureRef = "Genesis 49:26",
  supportingCopy = "A family, not a crowd — shaped by scripture, alive in the Spirit, and rooted in Ibadan.",
}: AuthSplitScreenProps) {
  return (
    <div className="grid lg:grid-cols-2 rounded-3xl overflow-hidden bg-white shadow-2xl ring-1 ring-black/5 w-full">
      <aside className="relative hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-[#87102C] via-[#6E0C24] to-[#4a081a] text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-200/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-8">
            <Image
              src="/logo.png"
              alt="Everlasting Hills"
              width={56}
              height={56}
              className="object-contain flex-shrink-0"
            />
            <div className="leading-tight">
              <p className="text-[10px] tracking-[0.3em] uppercase text-white/60 font-semibold">
                Everlasting Hills
              </p>
              <p className="text-base font-bold tracking-wide">Community Church</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="mb-2 inline-flex items-center gap-2">
            <span className="block w-6 h-px bg-amber-300/80" />
            <span className="block w-1.5 h-1.5 rounded-full bg-amber-300/80" />
            <span className="block w-6 h-px bg-amber-300/80" />
          </div>
          <blockquote className="text-2xl font-serif leading-snug mt-4">
            &ldquo;{scripture}&rdquo;
          </blockquote>
          <p className="mt-3 text-[10px] tracking-[0.3em] uppercase text-amber-300/90 font-bold">
            {scriptureRef}
          </p>
          <p className="mt-6 text-sm text-white/70 leading-relaxed max-w-sm">
            {supportingCopy}
          </p>
        </div>

        <div className="relative space-y-4">
          <div className="inline-flex items-center gap-2.5 rounded-full bg-white/8 border border-white/15 px-4 py-2 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-amber-300" />
            <span className="text-xs font-bold tracking-wide">
              Fruit by the well · Branches over the wall
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-white/40">
            <span>© 2026 Everlasting Hills, Ibadan</span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={12} />
              Secured
            </span>
          </div>
        </div>
      </aside>

      <section className="bg-white p-8 sm:p-12 flex flex-col justify-center">
        <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
          <Image
            src="/logoblack.png"
            alt="Everlasting Hills"
            width={48}
            height={48}
            className="object-contain"
          />
          <div className="leading-tight">
            <p className="text-[10px] tracking-[0.3em] uppercase text-gray-500 font-semibold">
              Everlasting Hills
            </p>
            <p className="text-sm font-bold text-gray-900">Community Church</p>
          </div>
        </div>
        {children}
      </section>
    </div>
  );
}
