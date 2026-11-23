import { Suspense } from "react";
import SetmanSection from "@/components/home/SetmanSection";
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
import BirthdayTeaserSection from "@/components/home/BirthdayTeaserSection";
import Carousel from "@/components/home/Carousel";
import { FadeIn } from "@/components/ui/motion/FadeIn";
import PledgeProjectSection from "@/components/home/PledgeProjectSection";
import PublicDailyScriptureSection from "@/components/home/PublicDailyScriptureSection";
import WordOfTheDaySection from "@/components/home/WordOfTheDaySection";

export const metadata = {
  title: "Everlasting Hills Church — Ibadan",
  description:
    "A church family in Ibadan, Nigeria. Join us Sunday for service.",
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
      {/* <PublicDailyScriptureSection />
      <WordOfTheDaySection /> */}
      <SetmanSection content={settings.SETMAN} />
        <Suspense fallback={null}>
        <EventSectionFade />
      </Suspense>
    
    
      <ScriptureSection content={settings.SCRIPTURE} />
      <Suspense
        fallback={
          <SermonsSection content={settings.SERMONS} telegramSermons={[]} />
        }
      >
        <TelegramSermons content={settings.SERMONS} />
      </Suspense>
      <ServiceSection content={settings.SERVICE} />
      <AttendanceSection />
      <PledgeProjectSection />
      <BirthdayTeaserSection />
      <TestimonialsSection content={settings.TESTIMONIALS} />
      <Carousel content={settings.CAROUSEL} />
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
