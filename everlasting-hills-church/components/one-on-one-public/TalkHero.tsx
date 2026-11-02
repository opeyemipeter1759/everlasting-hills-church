/** The opening of the public One-on-One pages: who this is for, in the church's colours. */
export default function TalkHero({ heading, lead }: { heading: string; lead: string }) {
  return (
    <section className="bg-[linear-gradient(135deg,#4A0819_0%,#87102C_58%,#A67C26_100%)] px-5 pb-14 pt-28 text-white sm:px-8 sm:pb-16 sm:pt-36">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-4">
        <p className="text-sm font-semibold text-white/75">Everlasting Hills Church, Ibadan</p>
        <h1 className="max-w-2xl font-serif text-[38px] font-bold leading-[1.08] [text-wrap:balance] sm:text-5xl">{heading}</h1>
        <p className="max-w-xl text-lg text-white/85">{lead}</p>
      </div>
    </section>
  );
}
