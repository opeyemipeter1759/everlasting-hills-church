import ScrollReveal from "@/components/home/ScrollReveal";
import { VALUES } from "./pastor-content";

export default function PastoralValues() {
  return (
    <section className="border-t border-black/[0.06] bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 xs:px-6 sm:px-8">
        <ScrollReveal>
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#87102C]">Our heart</p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight text-[#111]">What shapes how we shepherd</h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-black/[0.07] bg-[#FCFBFB] p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#87102C]/[0.08] text-[#87102C]">
                  <Icon size={18} />
                </span>
                <h3 className="mt-5 text-base font-semibold text-[#111]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#666]">{text}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
