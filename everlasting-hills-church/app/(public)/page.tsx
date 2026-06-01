import AboutSection from "@/components/home/AboutSection";
import CultureSection from "@/components/home/CultureSection";
import ScriptureSection from "@/components/home/ScriptureSection";
import ServiceSection from "@/components/home/ServiceSection";
import CommunitySection from "@/components/home/CommunitySection";
import ContactSection from "@/components/home/ContactSection";
import HeroSection from "@/components/home/HeroSection";
import SermonsSection from "@/components/home/SermonsSection";
import AttendanceSection from "@/components/home/AttendanceSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import { getAllSiteSettings } from "@/lib/site-settings";

export const metadata = {
  title: "Everlasting Hills Church — Ibadan",
  description: "A church family in Ibadan, Nigeria. Join us Sunday for service.",
};

// ISR matches the backend's 5-minute cache. Admin saves invalidate the
// backend cache instantly; the public page picks up changes on the next
// revalidation window (≤ 5 min) without manual purges.
export const revalidate = 300;

/**
 * Public homepage.
 *
 * Section order (top → bottom):
 *   Hero → About → Culture → Scripture → Services → Sermons → Attendance →
 *   Testimonials → Community → Contact
 *
 * All editable content comes from /site-settings — fetched server-side once
 * per request. Components ship with hardcoded fallbacks so the page renders
 * even if the API is down.
 */
export default async function HomePage() {
  const settings = await getAllSiteSettings();

  return (
    <main className="min-h-screen flex overflow-x-hidden flex-col bg-church-dark">
      <HeroSection content={settings.HERO} />
      <AboutSection content={settings.ABOUT} />
      <CultureSection content={settings.CULTURE} />
      <ScriptureSection content={settings.SCRIPTURE} />
      <ServiceSection content={settings.SERVICE} />
      <SermonsSection content={settings.SERMONS} />
      <AttendanceSection />
      <TestimonialsSection />
      <CommunitySection content={settings.COMMUNITY} />
      <ContactSection content={settings.CONTACT} />
    </main>
  );
}
