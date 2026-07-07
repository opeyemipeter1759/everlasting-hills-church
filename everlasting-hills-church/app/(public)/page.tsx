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
import { getTelegramSermons } from "@/lib/telegram-sermons";
import EventSection from "@/components/home/EventSection";
import Carousel from "@/components/home/Carousel";

export const metadata = {
  title: "Everlasting Hills Church — Ibadan",
  description: "A church family in Ibadan, Nigeria. Join us Sunday for service.",
};

export const revalidate = 300;


export default async function HomePage() {
  const [settings, telegramSermons] = await Promise.all([
    getAllSiteSettings(),
    getTelegramSermons(),
  ]);

  return (
    <main className="min-h-screen flex overflow-x-hidden flex-col bg-church-dark">
      <HeroSection content={settings.HERO} />
      <AboutSection content={settings.ABOUT} />
      <CultureSection content={settings.CULTURE} />
      <ScriptureSection content={settings.SCRIPTURE} />
      <ServiceSection content={settings.SERVICE} />
      <EventSection/>
      <SermonsSection content={settings.SERMONS} telegramSermons={telegramSermons} />
      <AttendanceSection />
      <TestimonialsSection />
      <Carousel/>
      <CommunitySection content={settings.COMMUNITY} />
      {/* <ContactSection content={settings.CONTACT} /> */}
    </main>
  );
}
