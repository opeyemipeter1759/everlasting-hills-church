/**
 * Server-side scraper for the Telegram channel's audio sermons.
 *
 * This lists the channel via Telegram's public, unauthenticated preview page
 * (t.me/s/<channel>) — no bot token or login needed just to know what's there.
 * That preview page does NOT expose a playable/downloadable URL for document
 * -type attachments (only for photos), so `audioUrl` here points at our own
 * /api/telegram-audio/[id] route, which uses a separate logged-in GramJS
 * session (see lib/telegram-client.ts) to actually fetch the bytes on demand.
 * `postUrl` is kept as a "listen on Telegram" fallback link.
 *
 * The channel this was built against has ~3800+ messages, but its audio sermons
 * sit in the oldest ~50, right at channel creation — recent activity is all
 * video/text. Reaching that depth via strictly sequential `before=` pagination
 * would take 100+ seconds (measured ~0.56s/page), which blows past a serverless
 * function's timeout. So this fetches pages CONCURRENTLY: it anchors on page 0
 * to find the starting cursor, then generates a run of `before` values at a
 * fixed stride (Telegram's preview renders ~20 messages/page) and fetches them
 * in bounded-concurrency batches, bailing out once a wall-clock time budget is
 * hit. The stride is an approximation (real spacing was 19–22 in testing), so
 * this can occasionally miss or duplicate a message at page boundaries —
 * duplicates are deduped by id; an occasional miss is an acceptable tradeoff
 * for a "best-effort list" feature with no in-page playback.
 *
 * No backend/DB means no persisted cursor between requests — every cache
 * regeneration re-walks from scratch. The long revalidate window keeps that rare.
 */
import * as cheerio from "cheerio";

export interface TelegramSermonItem {
  id: string;
  title: string;
  sizeLabel: string;
  publishedAt: string;
  postUrl: string;
  audioUrl: string;
}

const CHANNEL = process.env.TELEGRAM_CHANNEL_USERNAME?.trim() || "Pastoropeyemipeter";
const REVALIDATE_SECONDS = 21_600; // 6h — historical archive content, no need to be fresh-per-request.

const MAX_PAGES = Number(process.env.TELEGRAM_MAX_PAGES) || 300; // safety cap on generated cursors
const CONCURRENCY = Number(process.env.TELEGRAM_FETCH_CONCURRENCY) || 10;
const MAX_DURATION_MS = Number(process.env.TELEGRAM_MAX_DURATION_MS) || 25_000; // stay under typical serverless limits
const PAGE_STRIDE = 18; // slightly under Telegram's ~20/page to keep coverage overlapping, not gapped

const AUDIO_EXTENSIONS = [".aac", ".mp3", ".m4a", ".wav", ".ogg", ".opus"];

function isAudioTitle(title: string): boolean {
  const lower = title.toLowerCase();
  return AUDIO_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/** Strips the `?single` (or any) query string from a Telegram post URL. */
function cleanPostUrl(href: string): string {
  return href.split("?")[0];
}

async function fetchPage(before?: number): Promise<string | null> {
  const url = `https://t.me/s/${CHANNEL}${before ? `?before=${before}` : ""}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; EHCWebsite/1.0)" },
      next: { revalidate: REVALIDATE_SECONDS, tags: ["telegram-sermons"] },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/** Parses one preview page: audio items found + the real next `before` cursor (if any). */
function parsePage(html: string): { items: TelegramSermonItem[]; nextBefore: number | null } {
  const $ = cheerio.load(html);
  const items: TelegramSermonItem[] = [];

  $(".tgme_widget_message_wrap").each((_, wrap) => {
    const publishedAt = $(wrap).find("time.time").first().attr("datetime") ?? "";

    $(wrap)
      .find("a.tgme_widget_message_document_wrap")
      .each((__, doc) => {
        const title = $(doc).find(".tgme_widget_message_document_title").first().text().trim();
        if (!title || !isAudioTitle(title)) return;

        const sizeLabel = $(doc).find(".tgme_widget_message_document_extra").first().text().trim();
        const href = $(doc).attr("href");
        if (!href) return;

        const postUrl = cleanPostUrl(href);
        const id = postUrl.split("/").pop() ?? postUrl;

        items.push({ id, title, sizeLabel, publishedAt, postUrl, audioUrl: `/api/telegram-audio/${id}` });
      });
  });

  const rawBefore = $("a.js-messages_more[data-before]").first().attr("data-before");
  const nextBefore = rawBefore ? Number(rawBefore) : null;
  return { items, nextBefore: Number.isFinite(nextBefore) ? nextBefore : null };
}

export async function getTelegramSermons(): Promise<TelegramSermonItem[]> {
  const startedAt = Date.now();
  const seen = new Set<string>();
  const items: TelegramSermonItem[] = [];

  function addItems(pageItems: TelegramSermonItem[]) {
    for (const item of pageItems) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      items.push(item);
    }
  }

  const firstHtml = await fetchPage();
  if (!firstHtml) {
    console.warn(`[telegram-sermons] failed to fetch channel "${CHANNEL}"`);
    return [];
  }
  const { items: firstItems, nextBefore } = parsePage(firstHtml);
  addItems(firstItems);

  if (nextBefore) {
    const cursors: number[] = [];
    for (let cursor = nextBefore; cursor > 0 && cursors.length < MAX_PAGES; cursor -= PAGE_STRIDE) {
      cursors.push(cursor);
    }

    for (let i = 0; i < cursors.length; i += CONCURRENCY) {
      if (Date.now() - startedAt > MAX_DURATION_MS) break;

      const batch = cursors.slice(i, i + CONCURRENCY);
      const pages = await Promise.all(batch.map((cursor) => fetchPage(cursor)));
      for (const html of pages) {
        if (!html) continue;
        addItems(parsePage(html).items);
      }
    }
  }

  // Newest first, matching the YouTube tab's ordering.
  return items.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}
