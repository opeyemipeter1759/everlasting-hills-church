import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import CultureSection from "@/components/CultureSection";
import ScriptureSection from "@/components/ScriptureSection";
import ServiceSection from "@/components/ServiceSection";
import SermonsSection from "@/components/SermonsSection";
import CommunitySection from "@/components/CommunitySection";
import ContactSection from "@/components/ContactSection";
import GivingSection from "@/components/GivingSection";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-church-dark">
      <HeroSection />
      <AboutSection />
      <CultureSection />
      <ScriptureSection />
      <ServiceSection />
      <SermonsSection />
      <CommunitySection />
      {/* <ContactSection /> */}
      <GivingSection />
    </main>
  );
}
