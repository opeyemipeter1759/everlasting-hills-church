import TestimonialsCmsClient from "@/components/dashboard/admin/TestimonialsCmsClient";

export const metadata = { title: "Testimonials — Dashboard" };

/**
 * Admin CMS for homepage testimonials.
 *
 * Server Component shell. The actual list + form lives in a Client Component because:
 *   - Creating/editing/deleting are interactive (forms, optimistic updates)
 *   - We want React-Query-style refetch after mutations
 *
 * Middleware gates this route to PASTOR+ (see frontend-session.getRequiredRole).
 */
export default function TestimonialsAdminPage() {
  return <TestimonialsCmsClient />;
}
