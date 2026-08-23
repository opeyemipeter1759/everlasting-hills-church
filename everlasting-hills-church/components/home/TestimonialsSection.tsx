import EditorialTestimonials from "./EditorialTestimonials";
import { getTestimonials } from "@/data/testimonials";
import type { TestimonialsContent } from "@/lib/site-settings";

/**
 * "Member stories" — light, text-first editorial section. Testimonies are content,
 * not widgets: balanced reading columns on a white-to-blush ground, brand accents
 * used sparingly.
 *
 * Server component. Copy (label/headline/subtext/displayCount) is CMS-editable
 * from the homepage settings editor (Testimonials tab); the stories themselves
 * come through the getTestimonials() seam — published testimonials curated in
 * the Pastor Testimonials CMS — both ISR-cached for 5 minutes.
 */
export default async function TestimonialsSection({ content }: { content: TestimonialsContent }) {
  const all = await getTestimonials();
  const testimonials = all.slice(0, content.displayCount);

  if (testimonials.length === 0) return null;

  return (
    <section
      id="experience"
      aria-labelledby="member-stories-heading"
      className="bg-gradient-to-b from-white to-[#FBEAF0] px-5 py-24 sm:px-8 sm:py-28 dark:from-[#0a0a0a] dark:to-[#160a0e]"
    >
      <div className="mx-auto max-w-[1100px]">
        {/* Header */}
        <div className="mb-16 text-center">
          <span className="inline-flex items-center rounded-full bg-[#FFE8ED] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#87102C] dark:bg-white/10 dark:text-[#e8768a]">
            {content.label}
          </span>
          <h2
            id="member-stories-heading"
            className="mt-5 font-serif text-[clamp(2.25rem,1.6rem+2.4vw,3.5rem)] font-bold leading-[1.05] tracking-tight text-[#080808] dark:text-white"
          >
            {content.headline}
          </h2>
          <p className="mt-4 text-base text-[#080808]/55 dark:text-gray-400 sm:text-lg">
            {content.subtext}
          </p>
        </div>

        <EditorialTestimonials testimonials={testimonials} />
      </div>
    </section>
  );
}
