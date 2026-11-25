import Image from "next/image";
import { Gift, Sun, Users, UtensilsCrossed } from "lucide-react";
import { PHOTOS } from "@/components/picnic/picnic-config";
import { dateParts } from "@/components/picnic/picnic-content";
import { usePicnicContent } from "@/lib/api/picnic";

/** Fine red gingham, drawn in CSS. */
export const GINGHAM = {
  backgroundColor: "#FBF6EE",
  backgroundImage:
    "linear-gradient(90deg, rgba(135,16,44,0.5) 50%, transparent 50%), linear-gradient(rgba(135,16,44,0.5) 50%, transparent 50%)",
  backgroundSize: "12px 12px",
} as const;

const ON_THE_DAY = [
  { Icon: UtensilsCrossed, text: "Food to share on the grass" },
  { Icon: Sun, text: "Games for the children (and the grown-ups)" },
  { Icon: Gift, text: "The gift exchange" },
  { Icon: Users, text: "Time with the church family" },
];

/**
 * The invitation side of the register modal: a picnic photograph, the date as a
 * ticket stub, and what happens on the day. A short banner on phones.
 */
export function GiftModalAside() {
  const { data } = usePicnicContent();
  const d = dateParts(data?.date);

  return (
    <aside className="relative isolate flex min-h-[150px] shrink-0 flex-col justify-end overflow-hidden text-[#FBF4E6] md:min-h-0">
      <Image src={PHOTOS.unity.src.replace(/w=\d+/, "w=1200")} alt="" fill sizes="(max-width: 768px) 100vw, 400px" className="-z-10 object-cover object-[center_60%]" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#140C06]/95 via-[#140C06]/55 to-[#140C06]/10" />

      <div className="p-5 md:p-7">
        <p className="text-sm font-medium text-[#FBF4E6]/80">Everlasting Hills Church</p>
        <p className="mt-1 font-serif text-[1.75rem] leading-[1.05] md:text-[2.4rem]">
          The EHC Picnic<span className="text-[#F2B8C2]">.</span>
        </p>

          <div className="mt-4 hidden max-w-[17rem] md:mt-5 md:flex overflow-hidden rounded-xl bg-[#FBF6EE] text-[#1B1714] shadow-lg">
            <div className="flex w-[4.5rem] shrink-0 flex-col items-center justify-center bg-[#87102C] py-3 text-[#FBF4E6]">
              <span className="text-[11px] font-medium opacity-85">{d.top}</span>
              <span className="font-serif text-3xl leading-none">{d.long ? Number(d.big) : d.big}</span>
              <span className="mt-0.5 text-[11px] font-medium opacity-85">{d.bottom}</span>
            </div>
            <div className="flex flex-1 flex-col justify-center border-l-2 border-dashed border-[#1B1714]/15 px-4 py-3">
              <span className="text-xs text-[#1B1714]/55">Picnic day</span>
              <span className="text-sm font-semibold leading-snug">{d.when}</span>
              {data?.time && <span className="text-xs text-[#1B1714]/60">{data.time}</span>}
            </div>
          </div>

        <ul className="mt-6 hidden space-y-2.5 md:block md:[@media(max-height:640px)]:hidden">
          {ON_THE_DAY.map(({ Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm text-[#FBF4E6]/85">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FBF4E6]/15 ring-1 ring-[#FBF4E6]/20">
                <Icon size={14} aria-hidden="true" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>
      <div aria-hidden="true" className="h-2.5 w-full md:hidden" style={GINGHAM} />
    </aside>
  );
}
