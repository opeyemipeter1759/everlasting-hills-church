import AboutSection from "@/components/home/AboutSection";
import CultureSection from "@/components/home/CultureSection";
import ScriptureSection from "@/components/home/ScriptureSection";
import ServiceSection from "@/components/home/ServiceSection";
import CommunitySection from "@/components/home/CommunitySection";
import ContactSection from "@/components/home/ContactSection";
import GivingSection from "@/components/home/GivingSection";
import HeroSection from "@/components/home/HeroSection";
import SermonsSection from "@/components/home/SermonsSection";

export default function HomePage() {
  return (
    <main className="min-h-screen flex overflow-x-hidden flex-col bg-church-dark">
      <HeroSection />
      <AboutSection />
      <CultureSection />
      <ScriptureSection />
      <ServiceSection />
      <SermonsSection />
      <CommunitySection />
      <GivingSection />
      <ContactSection />
    </main>
  );
}
