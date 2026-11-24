import type { Pastor } from "./pastor-content";

export default function PastorsHero({ pastors }: { pastors: Pastor[] }) {
  return (
    <section className="relative overflow-hidden bg-[#0c0608] text-white">
      <div className="pointer-events-none absolute -right-32 -top-40 h-[28rem] w-[28rem] rounded-full bg-[#87102C]/40 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-[#87102C]/20 blur-[120px]" />
      <svg
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 right-[-4rem] hidden h-[22rem] w-[22rem] text-white/[0.05] md:block"
      >
        <path d="M4 32L20 8L36 32H4Z" stroke="currentColor" strokeWidth="0.6" />
        <path d="M11 32L20 14L29 32H11Z" stroke="currentColor" strokeWidth="0.6" />
        <path d="M16 32L20 20L24 32H16Z" fill="currentColor" />
      </svg>

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-32 xs:px-6 sm:px-8 sm:pb-20 sm:pt-40">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
          <span className="h-1.5 w-1.5 rounded-full bg-[#E04A6B]" />
          Leadership
        </p>
        <h1 className="mt-6 max-w-3xl text-balance font-serif text-4xl font-normal leading-[1.05] tracking-tight sm:text-6xl">
          Meet our pastors
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
          Shepherds of the Everlasting Hills Church family — given to the Word, to people, and to the next generation.
        </p>
        <nav aria-label="Pastors" className="mt-10 flex flex-wrap gap-3">
          {pastors.map((pastor) => (
            <a
              key={pastor.id}
              href={`#${pastor.id}`}
              className="group inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-1.5 pr-4 text-sm transition-colors hover:border-white/25 hover:bg-white/[0.08]"
            >
              <span className="relative h-8 w-8 overflow-hidden rounded-full bg-white/10">
                {pastor.photo ? (
                  <img src={pastor.photo} alt="" className="h-full w-full object-cover object-top" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-white/60">
                    {initials(pastor.name)}
                  </span>
                )}
              </span>
              <span className="flex flex-col leading-tight">
                <span className="font-medium text-white/90">{pastor.name}</span>
                <span className="text-[11px] text-white/45">{pastor.role}</span>
              </span>
            </a>
          ))}
        </nav>
      </div>
    </section>
  );
}

function initials(name: string) {
  return name
    .replace(/^Pastor\s+/i, "")
    .replace(/[\[\]]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}
