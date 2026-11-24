import { notFound } from "next/navigation";
import { DetailHero } from "@/components/programs/detail/DetailHero";
import { EditionsPanel } from "@/components/programs/detail/EditionsPanel";
import { SchedulePanel } from "@/components/programs/detail/SchedulePanel";
import { ScriptureBlock } from "@/components/programs/detail/ScriptureBlock";
import { SessionsTimeline } from "@/components/programs/detail/SessionsTimeline";
import { getProgram } from "@/lib/programs";

export const revalidate = 300;

/** One program: cover and call to action, its scripture, when it happens, the watches, the editions and its story. */
export default async function ProgramPage({ params }: { params: { slug: string } }) {
  const program = await getProgram(params.slug);
  if (!program) notFound();
  const renderedAt = new Date().toISOString();
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#080808] pb-24 text-white selection:bg-[#87102C]">
      <DetailHero program={program} />
      <ScriptureBlock scriptures={program.scriptures} />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-8">
          <SchedulePanel program={program} />
          <SessionsTimeline program={program} renderedAt={renderedAt} />
        </div>
        <div className="space-y-12">
          {program.longDescription && (
            <section aria-label={`About ${program.name}`}>
              {/* Sanitised on the server against an allowlist before it was saved. */}
              <div
                className="space-y-4 text-[17px] leading-[1.75] text-white/80 [&_a]:text-white [&_a]:underline [&_a]:underline-offset-4 [&_h3]:[font-family:var(--font-programs-serif)] [&_h3]:text-[24px] [&_h3]:text-white"
                dangerouslySetInnerHTML={{ __html: program.longDescription }}
              />
            </section>
          )}
          <EditionsPanel program={program} />
        </div>
      </div>
    </main>
  );
}
