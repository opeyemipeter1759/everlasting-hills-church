"use client";

import { useEffect, useState } from "react";
import { CircleNotch, DownloadSimple, Icon, LinkSimple, ShareNetwork } from "@/components/icons";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { PICNIC } from "./picnic-config";
import StatusPreview, { WhatsAppGlyph } from "./PicnicStatusPreview";
import { drawPicnicStatus } from "./picnic-status-image";

type Phase = "idle" | "working" | "shared" | "downloaded" | "error";

/**
 * "Put it on your status": builds a personalised 9:16 image and hands it to the
 * phone's share sheet (WhatsApp → My status, Instagram story, …). Where a browser
 * can't share files, the image downloads and WhatsApp opens with the link instead.
 */
export default function PicnicShare({ dateLong }: { dateLong: string }) {
  const user = useCurrentUser();
  const firstName = user?.fullName?.trim().split(/\s+/)[0] ?? null;
  const [phase, setPhase] = useState<Phase>("idle");
  const [copied, setCopied] = useState(false);

  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const pageUrl = `${origin}${PICNIC.path}`;
  const message = `${firstName ? "I'm" : "We're"} going to the Everlasting Hills Church picnic on ${dateLong}. Come with me! ${pageUrl}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(message)}`;

  async function shareStatus() {
    setPhase("working");
    try {
      const blob = await drawPicnicStatus({ name: user?.fullName ?? null, dateLong, siteHost: window.location.host });
      const file = new File([blob], "ehc-picnic-status.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text: message });
          setPhase("shared");
          return;
        } catch (e) {
          if ((e as DOMException).name === "AbortError") return setPhase("idle");
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ehc-picnic-status.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setPhase("downloaded");
    } catch {
      setPhase("error");
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the WhatsApp button still works */
    }
  }

  return (
    <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-20">
      <div className="order-2 lg:order-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#87102C]">Spread the word</p>
        <h2 className="mt-4 font-serif text-4xl leading-[1.05] tracking-tight text-[#1B1714] sm:text-5xl">
          Put it on your <span className="italic">status.</span>
        </h2>
        <p className="mt-5 max-w-md text-[16px] leading-relaxed text-[#1B1714]/65">
          We&apos;ve made you a status card{firstName ? ` with your name on it, ${firstName}` : ""}. Share it to WhatsApp or
          Instagram and bring someone who&apos;s never been to a church picnic before.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={shareStatus}
            disabled={phase === "working"}
            className="inline-flex items-center justify-center gap-2.5 rounded-full bg-[#87102C] px-7 py-3.5 text-[15px] font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-70"
          >
            {phase === "working" ? <Icon icon={CircleNotch} size={17} className="animate-spin" /> : <Icon icon={ShareNetwork} size={17} />}
            {phase === "working" ? "Making your card…" : "Share to my status"}
          </button>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2.5 rounded-full border border-[#1B1714]/15 bg-white px-7 py-3.5 text-[15px] font-semibold text-[#1B1714] transition-colors hover:border-[#1B1714]/30"
          >
            <WhatsAppGlyph /> Send on WhatsApp
          </a>
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-3.5 text-[15px] font-medium text-[#1B1714]/60 hover:text-[#1B1714]"
          >
            <Icon icon={LinkSimple} size={16} /> {copied ? "Link copied" : "Copy link"}
          </button>
        </div>

        <p aria-live="polite" className="mt-4 min-h-5 text-sm text-[#1B1714]/55">
          {phase === "shared" && "Shared. Thank you for inviting someone!"}
          {phase === "downloaded" && (
            <span className="inline-flex items-center gap-1.5">
              <Icon icon={DownloadSimple} size={14} /> Saved to your device — open WhatsApp → My status → add the picture.
            </span>
          )}
          {phase === "error" && "We couldn't make the card on this device. The WhatsApp button still works."}
        </p>
      </div>

      <StatusPreview firstName={firstName} dateLong={dateLong} />
    </div>
  );
}
