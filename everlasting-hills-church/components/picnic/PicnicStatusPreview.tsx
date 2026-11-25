import Image from "next/image";
import { PHOTOS, PICNIC } from "./picnic-config";

/** A phone-shaped mock of the status image, so people see what they'll post. */
export default function StatusPreview({ firstName, dateLong }: { firstName: string | null; dateLong: string }) {
  return (
    <div className="order-1 mx-auto w-full max-w-[300px] lg:order-2">
      <div className="relative rotate-[2deg] rounded-[2.4rem] bg-[#1B1714] p-2.5 shadow-[0_40px_80px_-30px_rgba(27,23,20,0.55)]">
        <div className="relative aspect-[9/16] overflow-hidden rounded-[1.9rem] bg-[#F7F0E3]">
          <div className="absolute inset-x-0 top-0 h-[58%]">
            <Image src={PHOTOS.hero.src} alt="" fill sizes="300px" className="object-cover" />
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/45 to-transparent" />
            <p className="absolute left-4 top-4 text-[7px] font-bold uppercase tracking-[0.3em] text-white">
              Everlasting Hills Church
            </p>
          </div>
          <div className="gingham-sm absolute inset-x-0 top-[55%] h-[6%]" />
          <div className="absolute inset-x-0 bottom-0 top-[60%] bg-[#F7F0E3] px-5 pt-4">
            <p className="font-[family-name:var(--nf-dancing)] text-lg leading-none text-[#87102C]">
              {firstName ? `${firstName} is going to` : "I'm going to"}
            </p>
            <p className="mt-1.5 font-serif text-[2.1rem] font-bold leading-[0.95] text-[#1B1714]">
              The EHC <span className="italic">Picnic.</span>
            </p>
            <div className="mt-3 h-px bg-[#1E3A2A]" />
            <p className="mt-2.5 text-[10px] font-semibold text-[#1B1714]">{dateLong}</p>
            <p className="mt-0.5 text-[8px] text-[#1B1714]/55">{PICNIC.venue ?? "Bring a blanket. Bring a friend."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="#25D366">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
    </svg>
  );
}
