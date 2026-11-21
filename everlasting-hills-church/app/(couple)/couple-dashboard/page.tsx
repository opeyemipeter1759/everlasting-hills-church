import type { Metadata } from "next";
import CoupleDashboard from "@/components/pre-marital/couple/CoupleDashboard";

export const metadata: Metadata = {
  title: "Your counselling dashboard · Everlasting Hills Church",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Pre-marital counselling, for a couple account. The middleware sends anyone not signed in to /login first. */
export default function CoupleDashboardPage() {
  return <CoupleDashboard />;
}
