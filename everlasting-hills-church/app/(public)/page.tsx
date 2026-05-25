import AboutSection from "@/components/home/AboutSection";
import CultureSection from "@/components/home/CultureSection";
import ScriptureSection from "@/components/home/ScriptureSection";
import ServiceSection from "@/components/home/ServiceSection";
import CommunitySection from "@/components/home/CommunitySection";
import ContactSection from "@/components/home/ContactSection";
import GivingSection from "@/components/home/GivingSection";
import HeroSection from "@/components/home/HeroSection";
import SermonsSection from "@/components/home/SermonsSection";
import LatestSermonsWidget from "@/components/home/LatestSermonsWidget";
//import { getFeaturedSermon, getLatestSermons } from "@/services/sermon.service";

export default async function HomePage() {
/*   const [featuredRaw, latestRaw] = await Promise.all([
    getFeaturedSermon(),
    getLatestSermons(3),
  ]) */;
/* 
  const featured = featuredRaw
    ? {
        id: featuredRaw.id,
        title: featuredRaw.title,
        slug: featuredRaw.slug,
        speaker: featuredRaw.speaker,
        date: featuredRaw.date.toISOString(),
        scriptureRef: featuredRaw.scriptureRef,
        series: featuredRaw.series,
        audioUrl: featuredRaw.audioUrl,
        videoUrl: featuredRaw.videoUrl,
        thumbnailUrl: featuredRaw.thumbnailUrl,
        playCount: featuredRaw.playCount,
      }
    : null;

  const latest = latestRaw.map((s) => ({
    id: s.id,
    title: s.title,
    slug: s.slug,
    speaker: s.speaker,
    date: s.date.toISOString(),
    scriptureRef: s.scriptureRef,
    series: s.series,
    audioUrl: s.audioUrl,
    videoUrl: s.videoUrl,
    thumbnailUrl: s.thumbnailUrl,
    playCount: s.playCount,
  })); */

  return (
    <main className="min-h-screen flex overflow-x-hidden flex-col bg-church-dark">
      <HeroSection />
      <AboutSection />
      <CultureSection />
      <ScriptureSection />
      <ServiceSection />
      <SermonsSection />
{/*      // <LatestSermonsWidget featured={featured} latest={latest} />
 */}      <CommunitySection />
      <GivingSection />
      <ContactSection />
    </main>
  );
}
