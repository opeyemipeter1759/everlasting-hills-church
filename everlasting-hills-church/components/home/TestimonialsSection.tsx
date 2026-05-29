import { Sparkles } from "lucide-react";
import { serverApi } from "@/lib/api/server";
import TestimonialsCarousel, { type Testimonial } from "./TestimonialsCarousel";

/**
 * "My Everlasting Hills Experience" — homepage testimonials section.
 *
 * Server Component: fetches public testimonials at request time (cached/revalidated by Next
 * via the `revalidate` hint below). Falls back to a tasteful empty state if none are
 * published yet or the backend is unreachable, instead of vanishing the section.
 *
 * The carousel itself is a Client Component because Embla touches the DOM.
 */

async function fetchTestimonials(): Promise<Testimonial[]> {
  try {
    return await serverApi.get<Testimonial[]>("/testimonials/published?limit=12", {
      withAuth: false,
      // Refresh every 5 minutes — fresh enough for editorial, cheap enough to scale.
      revalidate: 300,
    });
  } catch {
    return [];
  }
}

export default async function TestimonialsSection() {
  const testimonials = await fetchTestimonials();

  return (
    <section
      id="experience"
      className="py-20 sm:py-24 px-5 sm:px-8 bg-gradient-to-b from-white to-brand-blush/30 dark:from-[#0a0a0a] dark:to-[#1c1c1e]"
    >
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#87102C] mb-3">
            <Sparkles size={14} />
            Stories from the family
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
            My Everlasting Hills Experience
          </h2>
          <p className="mt-4 text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            What it&apos;s like to call this church home — in the words of the people who do.
          </p>
        </div>

        {testimonials.length === 0 ? (
          <EmptyState />
        ) : (
          <TestimonialsCarousel testimonials={testimonials} />
        )}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-8 py-16 text-center max-w-2xl mx-auto">
      <Sparkles size={28} className="mx-auto text-[#87102C]/40 mb-4" />
      <p className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Stories coming soon
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-500 max-w-md mx-auto">
        We&apos;re gathering testimonies from our church family. Want to share yours?
      </p>
      <a
        href="/testimony"
        className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-colors"
      >
        Share your story
      </a>
    </div>
  );
}
