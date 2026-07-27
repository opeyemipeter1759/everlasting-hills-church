import { Suspense } from "react";
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
import { getAllSiteSettings, type SermonsContent } from "@/lib/site-settings";
import { getTelegramSermons } from "@/lib/telegram-sermons";
import EventSection from "@/components/home/EventSection";
import Carousel from "@/components/home/Carousel";
import { FadeIn } from "@/components/ui/motion/FadeIn";

export const metadata = {
  title: "Everlasting Hills Church — Ibadan",
  description: "A church family in Ibadan, Nigeria. Join us Sunday for service.",
};

export const revalidate = 300;
async function TelegramSermons({ content }: { content: SermonsContent }) {
  const telegramSermons = await getTelegramSermons();
  return (
    <FadeIn>
      <SermonsSection content={content} telegramSermons={telegramSermons} />
    </FadeIn>
  );
}

export default async function HomePage() {
  const settings = await getAllSiteSettings();

  return (
    <main className="min-h-screen flex overflow-x-hidden flex-col bg-church-dark">
      <HeroSection content={settings.HERO} />
      <AboutSection content={settings.ABOUT} />
      <CultureSection content={settings.CULTURE} />
      <ScriptureSection content={settings.SCRIPTURE} />
      <ServiceSection content={settings.SERVICE} />
      <Suspense fallback={null}>
        <EventSectionFade />
      </Suspense>
      <Suspense fallback={<SermonsSection content={settings.SERMONS} telegramSermons={[]} />}>
        <TelegramSermons content={settings.SERMONS} />
      </Suspense>
      <AttendanceSection />
      <TestimonialsSection />
      <Carousel/>
      <CommunitySection content={settings.COMMUNITY} />
      {/* <ContactSection content={settings.CONTACT} /> */}
    </main>
  );
}

async function EventSectionFade() {
  return (
    <FadeIn>
      <EventSection />
    </FadeIn>
  );
}
