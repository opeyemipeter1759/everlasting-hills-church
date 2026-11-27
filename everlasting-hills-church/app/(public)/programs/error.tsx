"use client";

/** When the programs cannot be loaded: say so, and offer the one thing that helps. */
export default function ProgramsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center bg-[#080808] px-4 pt-24 text-white sm:px-6">
      <div className="mx-auto max-w-lg text-center">
        <p className="[font-family:var(--font-programs-serif)] text-[32px] leading-tight">The programs could not be loaded</p>
        <p className="mt-3 text-white/70">This is usually a weak connection. Try again in a moment.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 rounded-full bg-white px-6 py-3 text-[15px] font-semibold text-[#111] transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A04A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080808]"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
