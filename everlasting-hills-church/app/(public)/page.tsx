import AboutSection from "@/components/home/AboutSection";
import CultureSection from "@/components/home/CultureSection";
import ScriptureSection from "@/components/home/ScriptureSection";
import ServiceSection from "@/components/home/ServiceSection";
import CommunitySection from "@/components/home/CommunitySection";
import ContactSection from "@/components/home/ContactSection";
import GivingSection from "@/components/home/GivingSection";
import HeroSection from "@/components/home/HeroSection";
import SermonsSection from "@/components/home/SermonsSection";
import AttendanceSection from "@/components/home/AttendanceSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";

export const metadata = {
  title: "Everlasting Hills Church — Ibadan",
  description: "A church family in Ibadan, Nigeria. Join us Sunday for service.",
};

// Section order chosen for narrative flow:
//   Hero → About/Culture/Scripture (who we are)
//   Service (when/where)
//   Sermons (what we preach) + Attendance (engagement CTA)
//   Testimonials (social proof)
//   Community + Giving + Contact (calls to action)
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
      <GivingSection />
      <ContactSection />
    </main>
  );
}
