"use client";

import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, Share2 } from "lucide-react";
import CourseCertificate from "./CourseCertificate";

/** Scales the fixed 1200×848 certificate down to fit whatever container it's placed
 * in (a full page or a modal) — without affecting the DOM node's own measured size,
 * so html-to-image still captures the real 1200×848 regardless of on-screen scale. */
function useContainerScale(naturalWidth: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / naturalWidth));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [naturalWidth]);

  return { containerRef, scale };
}

/**
 * The reusable "preview, then decide" unit: shows the certificate scaled to fit,
 * with Download / Share underneath. Used by both the full certificate page and the
 * in-context modal opened from the course details sidebar.
 */
export default function CertificatePreviewPanel({
  memberName,
  courseTitle,
  completedAt,
  certificateNo,
}: {
  memberName: string;
  courseTitle: string;
  completedAt: string | null;
  certificateNo: string;
}) {
  const certRef = useRef<HTMLDivElement>(null);
  const { containerRef, scale } = useContainerScale(1200);
  const [busy, setBusy] = useState<"download" | "share" | null>(null);

  async function capture(): Promise<string | null> {
    if (!certRef.current) return null;
    return toPng(certRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: "#FAF6F0" });
  }

  const fileName = `${courseTitle.replace(/[^a-z0-9]+/gi, "-")}-certificate.png`;

  async function handleDownload() {
    setBusy("download");
    try {
      const dataUrl = await capture();
      if (!dataUrl) return;
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = fileName;
      a.click();
    } finally {
      setBusy(null);
    }
  }

  async function handleShare() {
    setBusy("share");
    try {
      const dataUrl = await capture();
      if (!dataUrl) return;
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${courseTitle} — Certificate of Training`,
          text: `I completed "${courseTitle}" at Everlasting Hills Church!`,
        });
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = fileName;
        a.click();
      }
    } catch {
      // User cancelled the share sheet or it's unsupported — nothing to surface.
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div ref={containerRef} className="w-full">
        <div style={{ height: 848 * scale }}>
          <div style={{ width: 1200, height: 848, transform: `scale(${scale})`, transformOrigin: "top left" }}>
            <div className="overflow-hidden rounded-xl sm:rounded-2xl shadow-xl ring-1 ring-black/5">
              <CourseCertificate
                ref={certRef}
                memberName={memberName}
                courseTitle={courseTitle}
                completedAt={completedAt}
                certificateNo={certificateNo}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <button
          type="button"
          onClick={handleDownload}
          disabled={busy !== null}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#87102C] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#6E0C24] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download size={16} />
          {busy === "download" ? "Preparing…" : "Download PNG"}
        </button>
        <button
          type="button"
          onClick={handleShare}
          disabled={busy !== null}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 px-4 py-3 text-sm font-bold text-gray-700 dark:text-white/80 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Share2 size={16} />
          {busy === "share" ? "Preparing…" : "Share"}
        </button>
      </div>
    </div>
  );
}

/** Stable, deterministic certificate number derived from the enrollment pair — no
 * extra column needed; same member + course always yields the same code. */
export function certificateNoFor(memberId: string, courseId: string): string {
  const hex = `${memberId}${courseId}`.replace(/-/g, "").slice(0, 10).toUpperCase();
  return `EHC-${hex}`;
}
