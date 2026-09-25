"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";

export interface EventAccordionItem {
  title: string;
  eyebrow?: string;
  body?: string;
  scriptures?: string[];
  points?: string[];
  declaration?: string;
}

export default function EventAccordion({ items }: { items: EventAccordionItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const baseId = useId();

  return (
    <div className="divide-y divide-[#E7CDD3] border-y border-[#E7CDD3]">
      {items.map((item, index) => {
        const open = openIndex === index;
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;
        return (
          <div key={`${item.title}-${index}`}>
            <h3>
              <button id={buttonId} type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpenIndex(open ? null : index)} className="flex min-h-16 w-full items-center gap-4 py-4 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#87102C]/20">
                <span className="min-w-0 flex-1">
                  {item.eyebrow && <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#87102C]">{item.eyebrow}</span>}
                  <span className="block text-base font-bold text-[#111] sm:text-lg">{item.title}</span>
                </span>
                <ChevronDown size={19} className={`flex-none text-[#87102C] transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!open} className="pb-6 pr-8 text-sm leading-7 text-[#555] sm:text-base">
              {item.body && <p className="whitespace-pre-line">{item.body}</p>}
              {item.scriptures && item.scriptures.length > 0 && <div className="mt-5"><h4 className="text-xs font-black uppercase tracking-[0.14em] text-[#111]">Scriptures</h4><ul className="mt-2 space-y-1">{item.scriptures.map((scripture, i) => <li key={i}>{scripture}</li>)}</ul></div>}
              {item.points && item.points.length > 0 && <div className="mt-5"><h4 className="text-xs font-black uppercase tracking-[0.14em] text-[#111]">Prayer points</h4><ol className="mt-2 list-decimal space-y-2 pl-5">{item.points.map((point, i) => <li key={i}>{point}</li>)}</ol></div>}
              {item.declaration && <blockquote className="mt-5 border-l-2 border-[#87102C] pl-4 font-semibold text-[#6E0C24]">{item.declaration}</blockquote>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
