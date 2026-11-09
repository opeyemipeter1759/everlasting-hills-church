"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Users } from "lucide-react";
import { getFrontendSessionUser } from "@/lib/auth/frontend-session";

/** Welcome hero carrying the signed-in admin's name, the date and two headline counts. */
export default function WelcomeHero({ members, attendance }: { members?: number; attendance?: number }) {
  // Computed after mount to avoid SSR/client hydration mismatch (cookie + clock are
  // only available client-side).
  const [hero, setHero] = useState<{ greeting: string; name: string | null; date: string }>({
    greeting: "Welcome",
    name: null,
    date: "",
  });

  useEffect(() => {
    const h = new Date().getHours();
    const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
    const name = getFrontendSessionUser()?.fullName?.trim().split(/\s+/)[0] ?? null;
    const date = new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    setHero({ greeting, name, date });
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{ background: "linear-gradient(155deg, #2a0410 0%, #4a0819 35%, #87102C 75%, #a01535 100%)" }}
    >
      <div aria-hidden="true" className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-amber-300/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 select-none text-[80px] font-black leading-none tracking-tight text-white/[0.04]">
        EHC
      </div>

      <div className="relative z-10 flex flex-col justify-between gap-6 p-4 xs:p-7 sm:flex-row sm:items-center sm:p-9">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] xs:tracking-[0.32em] text-[#FFB3C1]">
            Super Admin{hero.date ? ` · ${hero.date}` : ""}
          </p>
          <h1 className="text-2xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-3xl">
            {hero.greeting}
            {hero.name ? `, ${hero.name}` : ""} <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-2 max-w-[46ch] text-sm text-white/55">
            Here&apos;s everything happening across Everlasting Hills Church today.
          </p>
        </div>

        {(members !== undefined || attendance !== undefined) && (
          <div className="flex flex-wrap gap-2.5">
            {members !== undefined && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-sm">
                <Users size={14} aria-hidden="true" />
                {members.toLocaleString()} members
              </span>
            )}
            {attendance !== undefined && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-sm">
                <CheckCircle size={14} aria-hidden="true" />
                {attendance.toLocaleString()} last service
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
