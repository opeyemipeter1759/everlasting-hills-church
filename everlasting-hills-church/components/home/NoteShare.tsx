"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, Download, Loader2, Share2, X } from "lucide-react";
import { saveScriptureImage } from "@/lib/scripture-share";

/** WhatsApp's own green, so the option is recognised at a glance. */
const WHATSAPP_GREEN = "#25D366";

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.9 9.9 0 0 0 12.04 2Zm5.8 14.08c-.24.68-1.42 1.31-1.97 1.36-.5.05-1.13.24-3.8-.79-3.2-1.26-5.23-4.53-5.39-4.74-.16-.21-1.29-1.72-1.29-3.28 0-1.56.82-2.33 1.11-2.65.29-.32.63-.4.84-.4l.6.01c.19.01.45-.07.71.54.26.63.9 2.19.98 2.35.08.16.13.34.03.55-.11.21-.16.34-.32.52l-.47.55c-.16.16-.32.33-.14.65.19.32.83 1.37 1.78 2.21 1.22 1.09 2.25 1.43 2.57 1.59.32.16.5.13.69-.08.19-.21.79-.92 1-1.24.21-.32.42-.26.71-.16.29.11 1.84.87 2.16 1.03.32.16.53.24.61.37.08.13.08.76-.16 1.44Z" />
    </svg>
  );
}

/**
 * Share button for a hero note. Tapping it opens a popup in the notes' own
 * style — taped, frosted, handwritten — showing what will be shared, with
 * WhatsApp, download the status image, and copy the text. The image is drawn
 * as the popup opens, so it is ready by the time the member taps WhatsApp and
 * the phone's share sheet still counts it as their tap.
 *
 * The popup is rendered into <body>: the notes float and tilt (CSS
 * transforms), which would otherwise trap a fixed overlay inside the note.
 */
export default function NoteShare({
  what,
  title,
  preview,
  drawKey,
  draw,
  caption,
  compact = false,
}: {
  /** For screen readers and messages, e.g. "today’s scripture". */
  what: string;
  /** The popup's heading, e.g. "Share today’s scripture". */
  title: string;
  /** What is being shared, as it will read. */
  preview: ReactNode;
  /** Changes whenever the image would look different. */
  drawKey: string;
  draw: () => Promise<File[]>;
  caption: () => string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<{ key: string; files: File[] } | null>(null);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const ready = files?.key === drawKey ? files.files : null;
  const titleId = useId();

  const trigger = useRef<HTMLButtonElement | null>(null);
  const firstAction = useRef<HTMLButtonElement | null>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setFailed(false);
    drawRef
      .current()
      .then((made) => !cancelled && setFiles({ key: drawKey, files: made }))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [open, drawKey]);

  // While open: focus the first action, close on Escape, keep the page still,
  // and hand focus back to the Share button afterwards.
  useEffect(() => {
    if (!open) return;
    const button = trigger.current;
    firstAction.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      button?.focus();
    };
  }, [open]);

  function close() {
    setOpen(false);
    setCopied(false);
    setMessage("");
  }

  function saveAll(toSave: File[]) {
    toSave.forEach((file, index) =>
      index === 0 ? saveScriptureImage(file) : window.setTimeout(() => saveScriptureImage(file), index * 400),
    );
  }

  async function shareToWhatsApp() {
    setMessage("");
    // Phones: the share sheet with the image, where WhatsApp and its Status
    // are one tap away. Elsewhere: WhatsApp itself, with the words.
    if (ready && navigator.share && navigator.canShare?.({ files: ready })) {
      try {
        await navigator.share({ files: ready, text: caption() });
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(caption())}`, "_blank", "noopener,noreferrer");
  }

  function download() {
    if (!ready) return;
    saveAll(ready);
    setMessage(ready.length > 1 ? "Both images saved." : "Image saved.");
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(caption());
      setCopied(true);
      setMessage("Copied — paste it anywhere.");
    } catch {
      setMessage("Copying isn’t available here.");
    }
  }

  const secondary =
    "inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white/10 px-3 text-sm font-bold text-white transition hover:bg-white/20 disabled:opacity-50";

  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Share ${what}`}
        aria-haspopup="dialog"
        className={`inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/5 font-bold text-white transition hover:border-white/50 hover:bg-white/15 ${
          compact ? "px-3 py-1.5 text-[11px]" : "px-3.5 py-2 text-xs"
        }`}
      >
        <Share2 className="h-3 w-3" aria-hidden="true" />
        Share
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
            <div aria-hidden="true" onClick={close} className="absolute inset-0 animate-fade-in bg-black/65 backdrop-blur-sm" />

            <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="relative w-full max-w-sm animate-fade-up">
              <span
                aria-hidden="true"
                className="absolute -top-3 left-1/2 z-10 h-6 w-24 -translate-x-1/2 rotate-2 bg-church-accent/40 backdrop-blur-sm [clip-path:polygon(3%_0,97%_4%,100%_100%,0_94%)]"
              />
              <div className="relative -rotate-1 overflow-hidden rounded-2xl border border-white/15 bg-[#1b0d13]/95 p-5 text-left text-white shadow-[0_30px_80px_-20px_rgba(135,16,44,0.8)] sm:p-6">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-church-maroon/40 blur-3xl"
                />
                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <h2 id={titleId} className="text-[11px] font-black uppercase tracking-[0.24em] text-church-accent">
                      {title}
                    </h2>
                    <button
                      type="button"
                      onClick={close}
                      aria-label="Close sharing"
                      className="-mr-2 -mt-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="mt-3 max-h-[45vh] overflow-y-auto">{preview}</div>

                  <div className="mt-5 space-y-2 border-t border-white/10 pt-4">
                    {/* WhatsApp first and widest: it's what most members came to do. */}
                    <button
                      ref={firstAction}
                      type="button"
                      onClick={shareToWhatsApp}
                      style={{ backgroundColor: WHATSAPP_GREEN }}
                      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-bold text-white shadow-lg shadow-black/30 transition hover:brightness-110"
                    >
                      <WhatsAppIcon />
                      Share on WhatsApp
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={download}
                        disabled={!ready}
                        aria-label={`Download ${what} image`}
                        className={secondary}
                      >
                        {ready || failed ? (
                          <Download className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        )}
                        Download
                      </button>
                      <button type="button" onClick={copy} aria-label={`Copy ${what} text`} className={secondary}>
                        {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <p role="status" className="mt-3 min-h-4 text-center text-xs text-white/70">
                    {failed ? "The image couldn’t be made here — WhatsApp and Copy still work." : message}
                  </p>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
