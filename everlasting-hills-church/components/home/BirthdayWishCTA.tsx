"use client";

import Link from "next/link";
import { useCurrentUser } from "@/hooks";

/**
 * Client-only so the parent teaser section can stay a plain server component
 * (no cookies() read there, which would force the whole public homepage out
 * of static/ISR rendering) while still personalizing this one CTA.
 */
export function BirthdayWishCTA() {
  const user = useCurrentUser();
  const isSignedIn = !!user?.loggedIn;

  return (
    <Link
      href={isSignedIn ? "/dashboard" : "/login"}
      className="mt-9 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#87102C] hover:bg-white/90 transition-colors"
    >
      {isSignedIn ? "Go to your dashboard to send a wish" : "Sign in to send a birthday wish"}
    </Link>
  );
}
