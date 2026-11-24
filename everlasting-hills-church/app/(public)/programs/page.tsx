import type { Metadata } from "next";
import { ProgramGroups } from "@/components/programs/ProgramGroups";
import { ProgramsHero } from "@/components/programs/ProgramsHero";
import { RhythmStrip } from "@/components/programs/RhythmStrip";
import { getAnchor, getPrograms } from "@/lib/programs";

export const metadata: Metadata = {
  title: "Programs | Everlasting Hills Church",
  description: "The Prayer Watch, Dew of Heaven, Furnace and the rest of the rhythm of Everlasting Hills Church: what is on now, what is next, and how to join.",
};

export const revalidate = 300;

/** /programs: the hero, the rhythm of the house (on now and next), then every program by cadence. */
export default async function ProgramsPage() {
  const [programs, anchor] = await Promise.all([getPrograms(), getAnchor()]);
  const renderedAt = new Date().toISOString();
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#080808] text-white selection:bg-[#87102C]">
      <ProgramsHero anchor={anchor} />
      <RhythmStrip programs={programs} renderedAt={renderedAt} />
      <ProgramGroups programs={programs} renderedAt={renderedAt} />
    </main>
  );
}
