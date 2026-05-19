import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import CultureSection from "@/components/CultureSection";
import ScriptureSection from "@/components/ScriptureSection";
import ServiceSection from "@/components/ServiceSection";
import SermonsSection from "@/components/SermonsSection";
import CommunitySection from "@/components/CommunitySection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

/**
 * Everlasting Hills Church — Main Page
 *
 * Sections in order:
 * 1. Navbar         — fixed top navigation
 * 2. HeroSection    — full-screen hero with CTA
 * 3. AboutSection   — who we are
 * 4. CultureSection — Word | Spirit | Community
 * 5. ScriptureSection — Genesis 49:22–26 identity
 * 6. ServiceSection — Join Us This Sunday
 * 7. SermonsSection — Recent teachings
 * 8. CommunitySection — Belong here
 * 9. ContactSection — Form + social links
 * 10. Footer
 *
 * All content is editable within the individual component files.
 */
export default function HomePage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <AboutSection />
      <CultureSection />
      <ScriptureSection />
      <ServiceSection />
      <SermonsSection />
      <CommunitySection />
      <ContactSection />
      <Footer />
    </main>
  );
}
