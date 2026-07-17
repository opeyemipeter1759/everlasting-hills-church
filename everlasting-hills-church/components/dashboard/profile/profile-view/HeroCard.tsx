import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Pencil } from "lucide-react";
import { ease } from "./constants";
import { HeroAvatar } from "./HeroAvatar";
import { HeroBadges } from "./HeroBadges";

interface HeroCardProps {
  photoUrl: string | null;
  displayName: string;
  initials: string;
  role: string;
  bio: string | null;
  tenure: string;
  joinedAt: string | null;
}

/** Section 2 (left) — dark gradient hero: avatar, name, bio, badges, Edit CTA. */
export function HeroCard({ photoUrl, displayName, initials, role, bio, tenure, joinedAt }: HeroCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.08, ease }}
      aria-labelledby="profile-hero-name"
      className="lg:col-span-2 relative overflow-hidden rounded-2xl"
      style={{ background: "linear-gradient(155deg, #2a0410 0%, #4a0819 35%, #87102C 75%, #a01535 100%)" }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />
      <div aria-hidden="true" className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div aria-hidden="true" className="absolute -bottom-28 -left-16 w-64 h-64 rounded-full bg-amber-300/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 h-full p-7 sm:p-9 lg:p-10 flex flex-col gap-7">
        <div className="flex flex-col sm:flex-row sm:items-center gap-7">
          <HeroAvatar photoUrl={photoUrl} displayName={displayName} initials={initials} />

          <div className="flex-1 min-w-0">
            <p className="text-[10px] tracking-[0.32em] uppercase font-bold text-[#FFB3C1] mb-2">
              Everlasting Hills Church · {role}
            </p>
            <h2 id="profile-hero-name" className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-[1.1] text-balance">
              {displayName}
            </h2>
            {bio ? (
              <p className="text-sm sm:text-base text-white/70 italic mt-2 leading-relaxed max-w-[52ch] line-clamp-3">
                &ldquo;{bio}&rdquo;
              </p>
            ) : (
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                {tenure && (
                  <p className="text-sm text-white/55 leading-relaxed">
                    {tenure} as part of the Everlasting Hills family.
                  </p>
                )}
                <Link
                  href="/dashboard/settings"
                  className="group inline-flex items-center gap-1.5 text-xs font-semibold text-[#FFB3C1] hover:text-white transition-colors"
                >
                  Add your bio
                  <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                </Link>
              </div>
            )}

            <HeroBadges role={role} joinedAt={joinedAt} />
          </div>
        </div>

        <div className="mt-auto">
          <Link
            href="/dashboard/settings"
            className="group inline-flex items-center gap-2.5 px-5 py-3 rounded-xl
              bg-white text-[#87102C] text-sm font-bold tracking-wide shadow-lg
              hover:bg-amber-50 hover:-translate-y-0.5 hover:shadow-xl
              transition-all duration-200
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Pencil size={14} aria-hidden="true" />
            Edit Profile
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
