import CosmicContactHero from "@/components/home/CosmicContactHero";

export const metadata = {
  title: "Find Us — Everlasting Hills Church",
  description: "Address, phone, email, and directions to Everlasting Hills Church, Ibadan.",
};

/**
 * Cosmic-themed Find Us / Contact page.
 *
 * Server Component shell — the actual hero is a Client Component because it owns
 * the WebGL globe and the directions modal trigger.
 */
export default function ContactPage() {
  return <CosmicContactHero />;
}
