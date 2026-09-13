"use client";

import { useEffect, useState } from "react";
import { BookOpen, Check, Copy, Download, Loader2, Share2 } from "lucide-react";
import { useDailyScripture } from "@/lib/api/daily-scripture";
import {
  createScriptureImage,
  saveScriptureImage,
  scriptureCaption,
} from "@/lib/scripture-share";

export default function DailyScriptureCard() {
  const { data, isLoading, isError, refetch } = useDailyScripture();
  const [image, setImage] = useState<{
    key: string;
    file: File;
    url: string;
  } | null>(null);
  const [imageError, setImageError] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const imageKey = data
    ? `${data.date}|${data.reference}|${data.translationCode}|${data.text}`
    : "";
  const readyImage = image?.key === imageKey ? image : null;

  useEffect(() => {
    if (!data) return;
    let cancelled = false;
    let url: string | undefined;
    setImageError(false);
    setMessage("");
    setCopied(false);
    createScriptureImage(data)
      .then((file) => {
        if (cancelled) return;
        url = URL.createObjectURL(file);
        setImage({ key: imageKey, file, url });
      })
      .catch(() => {
        if (!cancelled) setImageError(true);
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [data, imageKey]);

  async function share() {
    if (!readyImage || sharing) return;
    setMessage("");
    const files = [readyImage.file];
    setSharing(true);
    try {
      if (!navigator.share || !navigator.canShare?.({ files })) {
        saveScriptureImage(readyImage.file);
        setMessage(
          "Image saved. Open WhatsApp → Updates → My status and choose the image.",
        );
        return;
      }
      await navigator.share({
        files,
        title: "Today’s scripture · Everlasting Hills Church",
      });
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setMessage(
          "Sharing couldn’t open. Save the image below and add it to your WhatsApp status.",
        );
      }
    } finally {
      setSharing(false);
    }
  }

  async function copyText() {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(scriptureCaption(data));
      setCopied(true);
      setMessage(
        "Scripture and church website copied. Paste them into your WhatsApp status.",
      );
    } catch {
      setMessage(
        "Copying is unavailable. You can select and copy the scripture text above.",
      );
    }
  }

  if (isLoading) {
    return (
      <section
        aria-label="Loading today’s scripture"
        className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/5"
      >
        <div className="h-4 w-40 rounded bg-gray-100 dark:bg-white/10" />
        <div className="mt-4 h-20 rounded bg-gray-100 dark:bg-white/10" />
      </section>
    );
  }

  if (!data || isError) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
        <h2 className="font-semibold dark:text-white">Scripture for today</h2>
        <p className="mt-2 text-sm text-gray-500">
          Today’s scripture couldn’t load.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-2 min-h-11 font-semibold text-[#87102C] dark:text-rose-300"
        >
          Try again
        </button>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="daily-scripture-title"
      className="min-w-0 overflow-hidden rounded-2xl border border-[#E7CDD3] bg-white dark:border-white/10 dark:bg-white/[0.03]"
    >
      <div className="bg-gradient-to-br from-[#220d20] to-[#740d2b] p-5 text-white sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="daily-scripture-title"
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#f5d49a]"
          >
            <BookOpen size={16} aria-hidden="true" />
            Scripture for today
          </h2>
          <time dateTime={data.date} className="text-xs text-white/65">
            {new Intl.DateTimeFormat("en-GB", {
              day: "numeric",
              month: "short",
              timeZone: "UTC",
            }).format(new Date(`${data.date}T12:00:00Z`))}
          </time>
        </div>
        <blockquote className="mt-4 max-w-3xl break-words font-serif text-xl leading-relaxed sm:text-2xl">
          {data.text}
        </blockquote>
        <p className="mt-4 text-sm font-semibold text-[#f5d49a]">
          {data.reference}{" "}
          <span className="font-normal text-white/65">
            · {data.translationCode}
          </span>
        </p>
      </div>

      <div className="p-4 sm:p-5">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Encourage someone today. Share a scripture image with our church’s
          name and website.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={share}
            disabled={!readyImage || sharing}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#87102C] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto"
          >
            {(!readyImage && !imageError) || sharing ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <Share2 size={16} aria-hidden="true" />
            )}
            {sharing ? "Opening sharing…" : "Share to WhatsApp Status"}
          </button>
          <button
            type="button"
            disabled={!readyImage}
            onClick={() => {
              if (readyImage) {
                saveScriptureImage(readyImage.file);
                setMessage(
                  "Image saved. Add it to WhatsApp → Updates → My status.",
                );
              }
            }}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 disabled:opacity-50 dark:border-white/15 dark:text-gray-200 sm:flex-none"
          >
            <Download size={16} aria-hidden="true" />
            Save image
          </button>
          <button
            type="button"
            onClick={copyText}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 dark:border-white/15 dark:text-gray-200 sm:flex-none"
          >
            {copied ? (
              <Check size={16} aria-hidden="true" />
            ) : (
              <Copy size={16} aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy text"}
          </button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          Choose WhatsApp, then My status. If sharing isn’t available on your
          phone, save the image and upload it in WhatsApp.
        </p>
        {imageError && (
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
            The status image couldn’t be prepared. You can still copy and share
            the scripture text.
          </p>
        )}
        {message && (
          <p
            role="status"
            className="mt-3 text-sm text-[#87102C] dark:text-rose-300"
          >
            {message}
          </p>
        )}
        {readyImage && (
          <details className="mt-3">
            <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium text-[#87102C] dark:text-rose-300">
              Preview status image
            </summary>
            <img
              src={readyImage.url}
              alt={`WhatsApp status image: ${data.reference}, with Everlasting Hills Church’s name and website`}
              width={1080}
              height={1920}
              className="mx-auto mt-2 h-auto w-full max-w-[280px] rounded-xl"
            />
          </details>
        )}
      </div>
    </section>
  );
}
