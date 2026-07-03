import ListSermon from "@/components/sermons/ListSermon";
import SermonHero from "@/components/sermons/SermonHero";
import { getStructuredContent } from "@/lib/cms-page";

export const metadata = {
  title: "Sermons — Everlasting Hills Church",
  description: "Watch and listen to recent messages from Everlasting Hills Church.",
};

interface SermonsIntro {
  eyebrow: string;
  title: string;
  subtitle: string;
}

const FALLBACK: SermonsIntro = {
  eyebrow: "Sermon Library",
  title: "Browse sermons by category",
  subtitle:
    "A fuller library view inspired by music apps: compact cards, clear categories, and quick access to audio or video messages.",
};

function isValid(c: unknown): c is SermonsIntro {
  const v = c as SermonsIntro;
  return Boolean(v && v.eyebrow && v.title && v.subtitle);
}

export default async function SermonsPage({ searchParams }: { searchParams: { preview?: string } }) {
  const c = await getStructuredContent("sermons", {
    preview: searchParams.preview,
    fallback: FALLBACK,
    valid: isValid,
  });

  return (
    <main>
      {searchParams.preview && (
        <div className="bg-[#87102C] text-white text-center text-xs font-semibold py-2 tracking-wide">
          PREVIEW — draft, not published
        </div>
      )}
      <SermonHero />
      <ListSermon eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle} />
    </main>
  );
}
