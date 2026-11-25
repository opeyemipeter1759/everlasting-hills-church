/** While /programs loads: the hero's shape and three cards' shapes, so nothing jumps when they arrive. */
export default function ProgramsLoading() {
  return (
    <main className="min-h-screen bg-[#080808] px-4 pb-24 pt-32 sm:px-6 sm:pt-40" aria-busy="true" aria-label="Loading programs">
      <div className="mx-auto max-w-6xl animate-pulse motion-reduce:animate-none">
        <div className="h-14 w-72 rounded-xl bg-white/10 sm:h-20 sm:w-[28rem]" />
        <div className="mt-6 h-5 w-full max-w-lg rounded bg-white/[0.07]" />
        <div className="mt-2 h-5 w-2/3 max-w-md rounded bg-white/[0.07]" />
        <div className="mt-14 h-12 w-full rounded-full bg-white/[0.05]" />
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-[24px] bg-white/[0.08] p-2">
              <div className="h-[148px] rounded-[20px] bg-white/[0.08]" />
              <div className="space-y-3 px-4 pb-4 pt-5">
                <div className="h-3 w-40 rounded bg-white/10" />
                <div className="h-7 w-48 rounded bg-white/[0.12]" />
                <div className="h-4 w-full rounded bg-white/[0.07]" />
                <div className="h-4 w-5/6 rounded bg-white/[0.07]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
