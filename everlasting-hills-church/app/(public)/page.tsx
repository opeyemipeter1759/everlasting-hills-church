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

export const metadata = {
  title: "Everlasting Hills Church — Ibadan",
  description: "A church family in Ibadan, Nigeria. Join us Sunday for service.",
};

/**
 * Public homepage.
 *
 * Section order (top → bottom):
 *   Hero → About → Culture → Scripture → Services → Sermons → Attendance →
 *   Testimonials → Community → Contact
 *
 * The bottom slab (Directions → Giving → Footer) lives in the public layout
 * (see app/(public)/layout.tsx → PageFooter) so every public page surfaces it.
 */
export default function HomePage() {
  return (
    <main className="min-h-screen flex overflow-x-hidden flex-col bg-church-dark">
      <HeroSection />
      <AboutSection />
      <CultureSection />
      <ScriptureSection />
      <ServiceSection />
      <SermonsSection />
      <AttendanceSection />
      <TestimonialsSection />
      <CommunitySection />
      <ContactSection />
    </main>
  );
}
