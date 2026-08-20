import Image from "next/image";
import { Cake, PartyPopper, Sparkles } from "lucide-react";
import { serverApi } from "@/lib/api/server";
import { ConfettiFall } from "@/components/ui/motion/ConfettiFall";
import { FloatingComments } from "@/components/ui/motion/FloatingComments";
import { BirthdayWishCTA } from "./BirthdayWishCTA";

interface CommunityBirthday {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  daysUntil: number;
}

async function fetchTeaserBirthdays(): Promise<CommunityBirthday[]> {
  try {
    return await serverApi.get<CommunityBirthday[]>("/members/birthdays/community?daysAhead=3", {
      withAuth: false,
      revalidate: 300,
    });
  } catch {
    return [];
  }
}

function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function dayLabel(daysUntil: number) {
  if (daysUntil === 0) return "Today";
  if (daysUntil === 1) return "Tomorrow";
  return `In ${daysUntil} days`;
}

export default async function BirthdayTeaserSection() {
  const celebrants = await fetchTeaserBirthdays();
  if (celebrants.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-church-dark py-14 sm:py-16">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-95"
        style={{ background: "linear-gradient(155deg, #3a0512 0%, #6a0d24 30%, #9c1433 60%, #c73a5a 100%)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #FFD84D 2.5px, transparent 2.5px)," +
            "radial-gradient(circle, #FF9ECF 2px, transparent 2px)," +
            "radial-gradient(circle, #8FE9DD 2px, transparent 2px)",
          backgroundSize: "42px 42px, 34px 34px, 28px 28px",
          backgroundPosition: "0 0, 12px 20px, 26px 6px",
        }}
      />
      <ConfettiFall className="opacity-70" />
      <FloatingComments />
      <div aria-hidden="true" className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-amber-300/20 blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: "4s" }} />
      <div aria-hidden="true" className="absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-fuchsia-400/15 blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: "5s", animationDelay: "1s" }} />

      <div aria-hidden="true" className="absolute left-10 top-6 text-3xl opacity-80 animate-bounce hidden sm:block" style={{ animationDuration: "3s" }}>🎈</div>
      <div aria-hidden="true" className="absolute right-14 top-10 text-2xl opacity-80 animate-bounce hidden sm:block" style={{ animationDuration: "3.4s", animationDelay: "0.4s" }}>🎈</div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <span className="relative mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 shadow-lg shadow-amber-500/30">
          <PartyPopper size={22} className="text-[#4a0819]" aria-hidden="true" />
          <Sparkles size={13} className="absolute -right-1 -top-1 text-amber-200 animate-pulse" aria-hidden="true" />
        </span>
        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-amber-200">Celebrating With Us ✨</p>
        <h2 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">Happy Birthday! 🎂</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
          Join us in celebrating members of our church family this week.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
          {celebrants.map((c) => (
            <div key={c.id} className="flex flex-col items-center gap-2">
              <div
                className={`relative h-16 w-16 overflow-hidden rounded-full ring-offset-2 ring-offset-transparent bg-white/10 flex items-center justify-center ${
                  c.daysUntil === 0 ? "ring-[3px] ring-amber-400" : "ring-2 ring-white/20"
                }`}
              >
                {c.photoUrl ? (
                  <Image src={c.photoUrl} alt="" fill sizes="64px" className="object-cover" />
                ) : (
                  <span className="text-lg font-extrabold text-white">{initials(c.firstName, c.lastName)}</span>
                )}
                {c.daysUntil === 0 && (
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 ring-2 ring-white/30">
                    <Cake size={11} className="text-[#4a0819]" aria-hidden="true" />
                  </span>
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-white">
                  {c.firstName} {c.lastName}
                </p>
                <p className={`text-[11px] ${c.daysUntil === 0 ? "font-bold text-amber-300" : "text-white/50"}`}>
                  {dayLabel(c.daysUntil)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <BirthdayWishCTA />
      </div>
    </section>
  );
}
