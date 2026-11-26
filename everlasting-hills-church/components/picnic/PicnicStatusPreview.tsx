import Image from "next/image";
import { PICNIC } from "./picnic-config";
import { dateParts, venueLabel } from "./picnic-content";

const SITE_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_APP_URL ?? "").host;
  } catch {
    return "www.everlastinghills.church";
  }
})();

/**
 * A phone-shaped mock of the status card (picnic-status-image.ts), laid out in
 * the same proportions — positions are percentages of the 1080×1920 canvas and
 * type is in container-width units — so what people see is what they post.
 */
export default function StatusPreview({ firstName, date, venue, photo }: { firstName: string | null; date: string | null; venue: string | null; photo: string }) {
  const d = dateParts(date);
  return (
    <div className="order-1 mx-auto w-full max-w-[300px] lg:order-2">
      <div className="relative rotate-[2deg] rounded-[2.4rem] bg-[#1B1714] p-2.5 shadow-[0_40px_80px_-30px_rgba(27,23,20,0.55)]">
        <div className="relative aspect-[9/16] overflow-hidden rounded-[1.9rem] bg-[#F7F0E3] [container-type:inline-size]">
          <div className="absolute inset-[2.6%] rounded-[2.6cqw] border border-[#1B1714]/15" />

          {/* Church lockup, as in the navbar */}
          <div className="absolute left-[5.9%] top-[4%] flex items-center gap-[1.6cqw]">
            <Image src="/logoblack.png" alt="" width={40} height={40} className="h-[8.9cqw] w-[8.9cqw]" />
            <div className="leading-none">
              <p className="text-[3.7cqw] font-bold text-[#111]">Everlasting Hills</p>
              <p className="mt-[0.8cqw] text-[2.6cqw] font-semibold uppercase tracking-[0.2em] text-[#87102C]">Church</p>
            </div>
          </div>

          {/* Inset photo + fine gingham ribbon */}
          <div className="absolute left-[5.9%] right-[5.9%] top-[11.5%] h-[44.8%] overflow-hidden rounded-[3.3cqw]">
            <Image src={photo} alt="" fill sizes="300px" className="object-cover" />
          </div>
          <div className="gingham-sm absolute left-[5.9%] right-[5.9%] top-[55.4%] h-[1.5%] [background-size:2.6cqw_2.6cqw]" />

          {/* Title */}
          <div className="absolute left-[5.9%] top-[59%]">
            <p className="text-[4.4cqw] font-medium leading-none text-[#87102C]">
              {firstName ? `${firstName} is going to` : "I'm going to"}
            </p>
            <p className="mt-[1.2cqw] font-serif text-[11.8cqw] font-semibold leading-[1.02] text-[#1B1714]">
              The EHC
              <br />
              <span className="text-[#87102C]">Picnic.</span>
            </p>
          </div>

          {/* Ticket stub */}
          <div className="absolute left-[5.9%] right-[5.9%] top-[79.7%] flex h-[11.7%] overflow-hidden rounded-[2.2cqw] bg-white">
            <div className="flex w-[20.6%] flex-col items-center justify-center bg-[#87102C] text-[#F7F0E3]">
              <span className="text-[2.2cqw] font-semibold uppercase tracking-[0.2em]">{d.top}</span>
              <span className="font-serif text-[7.8cqw] font-semibold leading-none">{d.big}</span>
              <span className="text-[2.2cqw] font-semibold uppercase tracking-[0.2em]">{d.bottom}</span>
            </div>
            <div className="flex flex-1 flex-col justify-center gap-[1.4cqw] border-l border-dashed border-[#1B1714]/20 pl-[3.7cqw]">
              <p className="text-[3.3cqw] font-semibold leading-tight text-[#1B1714]">
                <span className="block text-[2cqw] tracking-[0.25em] text-[#1B1714]/55">WHEN</span>
                {d.when}
              </p>
              <p className="text-[3.3cqw] font-semibold leading-tight text-[#1B1714]">
                <span className="block text-[2cqw] tracking-[0.25em] text-[#1B1714]/55">WHERE</span>
                {venueLabel(venue)}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="absolute left-[5.9%] right-[5.9%] top-[93.7%] border-t border-[#1B1714]/15 pt-[1.8cqw] text-center">
            <span className="text-[2.9cqw] font-bold text-[#87102C]">{SITE_HOST}{PICNIC.path}</span>
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
