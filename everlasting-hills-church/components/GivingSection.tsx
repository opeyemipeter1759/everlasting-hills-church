"use client";

export default function GivingSection() {
  return (
    <section aria-labelledby="giving-heading" className="max-w-6xl mx-auto px-5 sm:px-8 mb-16">
      <div className="relative">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/7 backdrop-blur-sm shadow-lg px-6 py-8 sm:px-8 sm:py-10">
          <div className="relative grid gap-6 md:grid-cols-2 items-start">
            <div className="space-y-5 pr-2">
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.35em] text-white/60 shadow-inner shadow-black/20">
                Support our work
              </div>
              <div>
                <h2 id="giving-heading" className="text-3xl sm:text-4xl font-semibold text-white tracking-tight leading-tight">
                  Partner with Everlasting Hills
                </h2>
                <p className="mt-4 max-w-xl text-white/65 leading-relaxed">
                  Your generosity supports pastoral care, local outreach, and church projects. Every gift — large or small — helps us serve our city and grow community impact.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-[#12050a]/90 p-4">
                  <p className="text-white/40 text-[11px] uppercase tracking-[0.35em] mb-1">Secure & easy</p>
                  <p className="text-white text-sm font-semibold">Fast, encrypted giving</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-[#12050a]/90 p-4">
                  <p className="text-white/40 text-[11px] uppercase tracking-[0.35em] mb-1">Flexible</p>
                  <p className="text-white text-sm font-semibold">One-time or recurring</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-[#12050a]/90 p-4">
                  <p className="text-white/40 text-[11px] uppercase tracking-[0.35em] mb-1">Local impact</p>
                  <p className="text-white text-sm font-semibold">Supports ministries & outreach</p>
                </div>
              </div>
            </div>

            <aside className="rounded-[20px] border border-white/8 bg-[#12050a]/95 p-6 shadow-sm md:ml-4">
              <p className="text-white/50 text-xs uppercase tracking-[0.25em] font-semibold mb-5">How to give</p>
              <div className="space-y-5">
                <div className="rounded-3xl border border-white/5 bg-white/5 p-4">
                  <p className="text-white font-semibold">Give online</p>
                  <p className="mt-2 text-white/55 text-sm leading-relaxed">Secure checkout for one-time or recurring gifts.</p>
                </div>
                <div className="rounded-3xl border border-white/5 bg-white/5 p-4">
                  <p className="text-white font-semibold">In-person offering</p>
                  <p className="mt-2 text-white/55 text-sm leading-relaxed">Bring your gift during weekend services or events.</p>
                </div>
                <div className="rounded-3xl border border-white/5 bg-white/5 p-4">
                  <p className="text-white font-semibold">Designated giving</p>
                  <p className="mt-2 text-white/55 text-sm leading-relaxed">Support building, outreach, or specific ministries.</p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 md:flex-row">
                <a href="/give" className="w-full md:w-auto inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-church-dark shadow transition hover:bg-white/95">Give Online</a>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
