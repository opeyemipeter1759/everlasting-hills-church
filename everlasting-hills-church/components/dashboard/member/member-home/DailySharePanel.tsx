"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { BookOpen, Check, Copy, Download, Layers, Loader2, Share2, Sparkles, X } from "lucide-react";
import type { DailyScripture } from "@/lib/api/daily-scripture";
import { useHillsConfession } from "@/components/sermon-digest/useHillsConfession";
import {
  confessionCaption,
  createConfessionImage,
  createScriptureImage,
  saveScriptureImage,
  scriptureAndConfessionCaption,
  scriptureCaption,
} from "@/lib/scripture-share";

type Target = "scripture" | "confession" | "both";

const TARGETS: { id: Target; label: string; icon: typeof BookOpen }[] = [
  { id: "both", label: "Both", icon: Layers },
  { id: "scripture", label: "Scripture", icon: BookOpen },
  { id: "confession", label: "Confession", icon: Sparkles },
];

const SCRIPTURE_ALT = "WhatsApp status image of today’s scripture, with Everlasting Hills Church’s name and website";
const CONFESSION_ALT = "WhatsApp status image of the Hills Confession, with Everlasting Hills Church’s name and website";

type Drawn = { file: File; alt: string };
type Prepared = { key: string; items: { file: File; url: string; alt: string }[] };

/**
 * One place to share today's word: both the scripture and the Hills
 * Confession at once (the default), or either on its own. The preview, WhatsApp status share, saved images and copied
 * text all follow that choice. Images are drawn before the tap so the phone's
 * share sheet keeps the member's gesture; "Both" sends the two images together,
 * which WhatsApp posts as two status updates.
 */
export default function DailySharePanel({
  scripture,
  translationChanging,
  versionPicker,
}: {
  scripture: DailyScripture;
  /** A new Bible version is loading: the old wording must not be shared under its label. */
  translationChanging: boolean;
  versionPicker: ReactNode;
}) {
  // Both first: most members share the verse and the confession together.
  const [target, setTarget] = useState<Target>("both");
  const confession = useHillsConfession(scripture.date);

  const scriptureKey = `${scripture.date}|${scripture.reference}|${scripture.translationCode}|${scripture.text}`;
  const confessionKey = JSON.stringify(confession.share);
  const drawScripture = async (): Promise<Drawn> => ({ file: await createScriptureImage(scripture), alt: SCRIPTURE_ALT });
  const drawConfession = async (): Promise<Drawn> => ({ file: await createConfessionImage(confession.share), alt: CONFESSION_ALT });

  const content = {
    scripture: {
      key: `scripture|${scriptureKey}`,
      draw: () => Promise.all([drawScripture()]),
      caption: () => scriptureCaption(scripture),
      title: "Today’s scripture · Everlasting Hills Church",
      copied: "Scripture and church website copied.",
    },
    confession: {
      key: `confession|${confessionKey}`,
      draw: () => Promise.all([drawConfession()]),
      caption: () => confessionCaption(confession.share),
      title: "The Hills Confession · Everlasting Hills Church",
      copied: "Confession and church website copied.",
    },
    both: {
      key: `both|${scriptureKey}|${confessionKey}`,
      draw: () => Promise.all([drawScripture(), drawConfession()]),
      caption: () => scriptureAndConfessionCaption(scripture, confession.share),
      title: "Today’s scripture and the Hills Confession · Everlasting Hills Church",
      copied: "Scripture, confession and church website copied.",
    },
  }[target];
  const usesScripture = target !== "confession";
  const plural = target === "both";

  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [imageError, setImageError] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const [enlarged, setEnlarged] = useState(false);
  const ready = !(usesScripture && translationChanging) && prepared?.key === content.key ? prepared : null;

  // The latest drawing function, so the effect below runs only when what the
  // images show changes, not on every render.
  const draw = useRef(content.draw);
  draw.current = content.draw;

  useEffect(() => {
    let cancelled = false;
    let urls: string[] = [];
    setImageError(false);
    setCopied(false);
    setMessage("");
    draw
      .current()
      .then((drawn) => {
        if (cancelled) return;
        const items = drawn.map(({ file, alt }) => ({ file, alt, url: URL.createObjectURL(file) }));
        urls = items.map((item) => item.url);
        setPrepared({ key: content.key, items });
      })
      .catch(() => {
        if (!cancelled) setImageError(true);
      });
    return () => {
      cancelled = true;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [content.key]);

  function saveAll(files: File[]) {
    // The first on the tap itself; a beat before the next, so the browser doesn't drop it.
    files.forEach((file, index) =>
      index === 0 ? saveScriptureImage(file) : window.setTimeout(() => saveScriptureImage(file), index * 400),
    );
  }

  async function share() {
    if (!ready || sharing) return;
    setMessage("");
    const files = ready.items.map((item) => item.file);
    setSharing(true);
    try {
      if (!navigator.share || !navigator.canShare?.({ files })) {
        saveAll(files);
        setMessage(
          plural
            ? "Both images saved. Open WhatsApp → Updates → My status and choose them."
            : "Image saved. Open WhatsApp → Updates → My status and choose the image.",
        );
        return;
      }
      await navigator.share({ files, title: content.title });
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setMessage(`Sharing couldn’t open. Save the ${plural ? "images" : "image"} and add ${plural ? "them" : "it"} to your WhatsApp status.`);
      }
    } finally {
      setSharing(false);
    }
  }

  function save() {
    if (!ready) return;
    saveAll(ready.items.map((item) => item.file));
    setMessage(`${plural ? "Both images" : "Image"} saved. Add ${plural ? "them" : "it"} to WhatsApp → Updates → My status.`);
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(content.caption());
      setCopied(true);
      setMessage(`${content.copied} Paste into your WhatsApp status.`);
    } catch {
      setMessage("Copying is unavailable. You can select and copy the words above.");
    }
  }

  const secondary =
    "inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-[#87102C]/40 hover:text-[#87102C] disabled:opacity-50 dark:border-white/15 dark:bg-transparent dark:text-gray-200 sm:flex-none";

  const confessionNote = (
    <div className="rounded-xl border border-[#E7CDD3] bg-[#FFF8F9] p-3 text-sm dark:border-white/10 dark:bg-white/[0.04]">
      <p className="font-semibold text-gray-900 dark:text-white">
        {plural ? "With the Hills Confession" : confession.source}
      </p>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
        {confession.sermon
          ? `${plural ? `${confession.source} · ` : ""}Word of the Day: ${confession.sermon.word}${confession.sermon.verse.reference ? ` · ${confession.sermon.verse.reference}` : ""}`
          : "Updates with each Sunday and Wednesday sermon."}
      </p>
    </div>
  );

  return (
    <div className="p-4 sm:p-5">
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white">Share today’s word</h3>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          Encourage someone today. Every image carries our church’s name and website.
        </p>
      </div>

      <div role="radiogroup" aria-label="What to share" className="mt-4 grid grid-cols-3 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-white/[0.06]">
        {TARGETS.map(({ id, label, icon: Icon }) => {
          const active = target === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => {
                setTarget(id);
                setEnlarged(false);
              }}
              className={`inline-flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 text-sm font-semibold transition ${
                active
                  ? "bg-white text-[#87102C] shadow-sm dark:bg-white/15 dark:text-white"
                  : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              <Icon size={15} aria-hidden="true" className="hidden shrink-0 min-[400px]:block" />
              {label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-[72px_1fr] gap-x-4 gap-y-3 sm:grid-cols-[104px_1fr] sm:grid-rows-[auto_1fr]">
        {/* Preview: exactly what goes to the status. Two images fan out for "Both". */}
        <button
          type="button"
          onClick={() => ready && setEnlarged((open) => !open)}
          disabled={!ready}
          aria-label={enlarged ? "Hide the large preview" : `Show the status ${plural ? "images" : "image"} larger`}
          className={`relative aspect-[9/16] self-start rounded-lg sm:row-span-2 ${
            ready && plural ? "" : "overflow-hidden border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5"
          }`}
        >
          {ready ? (
            ready.items.map((item, index) => (
              // A local blob preview; next/image adds nothing here.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={item.url}
                src={item.url}
                alt=""
                className={
                  plural
                    ? `absolute w-[80%] rounded-md border border-white shadow-md dark:border-white/20 ${
                        index === 0 ? "left-0 top-0 -rotate-6" : "bottom-0 right-0 rotate-6"
                      }`
                    : "h-full w-full object-cover"
                }
              />
            ))
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-gray-400">
              {imageError ? <X size={18} aria-hidden="true" /> : <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
            </span>
          )}
        </button>

        <div className="min-w-0 space-y-2">
          {usesScripture && versionPicker}
          {target !== "scripture" && confessionNote}
        </div>

        {/* Full width under the preview on phones; beside it from sm up. */}
        <div className="col-span-2 flex flex-wrap items-start gap-2 self-start sm:col-span-1 sm:col-start-2">
          <button
            type="button"
            onClick={share}
            disabled={!ready || sharing}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#87102C] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#6d0d24] disabled:opacity-50 sm:w-auto"
          >
            {(!ready && !imageError) || sharing ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <Share2 size={16} aria-hidden="true" />
            )}
            {sharing ? "Opening sharing…" : "Share to WhatsApp Status"}
          </button>
          <button type="button" disabled={!ready} onClick={save} className={secondary}>
            <Download size={16} aria-hidden="true" />
            {plural ? "Save images" : "Save image"}
          </button>
          <button type="button" onClick={copyText} className={secondary}>
            {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
            {copied ? "Copied" : "Copy text"}
          </button>
        </div>
      </div>

      {imageError && (
        <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
          The status image couldn’t be prepared. You can still copy and share the text.
        </p>
      )}
      {message && (
        <p role="status" className="mt-3 text-sm text-[#87102C] dark:text-rose-300">
          {message}
        </p>
      )}
      <p className="mt-3 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
        On your phone, choose WhatsApp, then My status. No share option? Save the {plural ? "images" : "image"} and upload{" "}
        {plural ? "them" : "it"} in WhatsApp.
      </p>

      {enlarged && ready && (
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {ready.items.map((item) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={item.url}
              src={item.url}
              alt={item.alt}
              width={1080}
              height={1920}
              className="h-auto w-full max-w-[240px] rounded-xl shadow-lg"
            />
          ))}
        </div>
      )}
    </div>
  );
}
