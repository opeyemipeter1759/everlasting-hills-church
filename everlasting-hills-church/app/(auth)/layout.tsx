import Navbar from "@/components/home/Navbar";
import PageFooter from "@/components/home/PageFooter";

/**
 * Auth layout shell.
 *
 * Auth pages share the public navbar + the unified PageFooter slab so users always
 * have a path back to the rest of the site (and a visible giving/directions CTA).
 *
 * Background image lives here (not in individual pages) so login, register and
 * change-password don't each re-declare it.
 *
 * The form area uses max-w-5xl so split-screen designs (e.g. login) have room.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-church-dark">
      <Navbar />

      <main className="relative min-h-[80vh] bg-church-dark text-white overflow-hidden py-16 sm:py-24 px-4 sm:px-5 selection:bg-church-maroon">
        {/* Cinematic background image with fade gradients */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/church_congregation_3_1779193624434.png"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover opacity-40 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-church-dark via-church-dark/40 to-church-dark" />
          <div className="absolute inset-0 bg-gradient-to-b from-church-dark/80 via-transparent to-church-dark/80" />
          <div className="absolute inset-0 bg-church-dark/20 backdrop-brightness-[0.8]" />
        </div>

        {/* Page content — split-screen login, register, change-password, etc. */}
        <div className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-center min-h-[60vh]">
          {children}
        </div>
      </main>

      <PageFooter />
    </div>
  );
}
