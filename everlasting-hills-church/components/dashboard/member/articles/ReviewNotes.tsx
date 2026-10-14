"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, MessageSquarePlus, RotateCcw, Trash2, Wand2, X } from "lucide-react";
import {
  useAddReviewNote,
  useDeleteReviewNote,
  useResolveReviewNote,
  useReviewNotes,
  type ReviewNote,
} from "@/lib/api/articles";
import { storyDate } from "@/components/medium/story";

/**
 * Finds a quoted passage in an element's text, ignoring differences in
 * spacing and line breaks (a selection across paragraphs reads back with
 * newlines the rendered text does not have), and returns a DOM Range for it.
 */
export function findQuoteRange(root: HTMLElement, quote: string): Range | null {
  const target = quote.replace(/\s+/g, "");
  if (!target) return null;
  const chars: { node: Text; offset: number }[] = [];
  let compact = "";
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    const text = node.data;
    for (let i = 0; i < text.length; i += 1) {
      if (/\s/.test(text[i])) continue;
      chars.push({ node, offset: i });
      compact += text[i];
    }
  }
  const at = compact.indexOf(target);
  if (at < 0) return null;
  const first = chars[at];
  const last = chars[at + target.length - 1];
  const range = document.createRange();
  range.setStart(first.node, first.offset);
  range.setEnd(last.node, last.offset + 1);
  return range;
}

type HighlightRegistry = { set: (name: string, h: unknown) => void; delete: (name: string) => void };
function highlights(): HighlightRegistry | null {
  const css = (globalThis as { CSS?: { highlights?: HighlightRegistry } }).CSS;
  const Ctor = (globalThis as { Highlight?: new (...r: Range[]) => unknown }).Highlight;
  return css?.highlights && Ctor ? css.highlights : null;
}
function paint(name: string, ranges: Range[]) {
  const reg = highlights();
  const Ctor = (globalThis as { Highlight?: new (...r: Range[]) => unknown }).Highlight;
  if (!reg || !Ctor) return;
  if (ranges.length) reg.set(name, new Ctor(...ranges));
  else reg.delete(name);
}

function NoteCard({
  note,
  canResolve,
  onResolve,
  onDelete,
  onShow,
  onApply,
  busy,
}: {
  note: ReviewNote;
  canResolve: boolean;
  onResolve: (resolved: boolean) => void;
  onDelete: () => void;
  onShow: () => void;
  onApply?: () => void;
  busy: boolean;
}) {
  const resolved = !!note.resolvedAt;
  return (
    <li className={`m-paper border m-rule p-4 ${resolved ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2 text-[13px]">
        <p>
          <span className="m-ink font-medium">{note.authorName}</span>
          <span className="m-muted"> · {note.fromReviewer ? "Reviewer" : "Author"} · {storyDate(note.createdAt)}</span>
          {resolved && <span className="m-muted"> · Resolved</span>}
        </p>
        {note.mine && (
          <button type="button" onClick={onDelete} disabled={busy} aria-label="Delete this note" className="m-icon-btn !min-h-8 !min-w-8">
            <Trash2 size={14} aria-hidden="true" />
          </button>
        )}
      </div>
      {note.quote && (
        <button type="button" onClick={onShow} className="m-muted mt-2 block w-full border-l-2 border-[#e0b400] bg-[rgba(255,214,0,0.15)] px-3 py-1.5 text-left text-sm italic hover:bg-[rgba(255,214,0,0.3)]" title="Show in the story">
          “{note.quote.length > 180 ? `${note.quote.slice(0, 177)}…` : note.quote}”
        </button>
      )}
      {note.suggestion && (
        <p className="m-ink mt-2 text-sm">
          <span className="m-muted">Suggested: </span>
          <span className="font-medium">{note.suggestion}</span>
        </p>
      )}
      <p className="m-ink mt-2 whitespace-pre-line break-words text-sm">{note.body}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {onApply && note.suggestion && !resolved && (
          <button type="button" onClick={onApply} disabled={busy} className="m-pill !min-h-8 !px-3 text-[13px]">
            <Wand2 size={13} aria-hidden="true" /> Apply suggestion
          </button>
        )}
        {canResolve && (
          <button type="button" onClick={() => onResolve(!resolved)} disabled={busy} className="m-pill-outline !min-h-8 !px-3 text-[13px]">
            {resolved ? <RotateCcw size={13} aria-hidden="true" /> : <Check size={13} aria-hidden="true" />}
            {resolved ? "Reopen" : "Resolve"}
          </button>
        )}
      </div>
    </li>
  );
}

/**
 * Comments and suggestions between an article's author and its reviewers, as
 * in Google Docs: highlight words in the story, then comment on just that
 * passage (and suggest new wording), or comment on the whole piece. Sending a
 * note never approves or returns the story. The passages are highlighted in
 * the text, and the author can apply a suggestion in the editor.
 *
 * `bodyId` is the element holding the story's text; without it (the editor)
 * there is no highlighting, and `onApply` replaces the quote in the draft.
 */
export default function ReviewNotes({
  articleId,
  bodyId,
  enabled,
  onApply,
}: {
  articleId: string;
  bodyId?: string;
  enabled: boolean;
  onApply?: (note: ReviewNote) => boolean;
}) {
  const { data, isError } = useReviewNotes(articleId, enabled);
  const add = useAddReviewNote(articleId);
  const resolve = useResolveReviewNote(articleId);
  const remove = useDeleteReviewNote(articleId);
  const [selection, setSelection] = useState<{ quote: string; x: number; y: number } | null>(null);
  const [draft, setDraft] = useState<{ quote: string | null } | null>(null);
  const [body, setBody] = useState("");
  const [suggest, setSuggest] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  const composer = useRef<HTMLTextAreaElement>(null);

  const notes = useMemo(() => data?.notes ?? [], [data]);
  const open = notes.filter((n) => !n.resolvedAt);
  const done = notes.filter((n) => n.resolvedAt);
  const busy = add.isPending || resolve.isPending || remove.isPending;

  // Highlight every open note's passage in the story.
  useEffect(() => {
    if (!bodyId) return;
    const root = document.getElementById(bodyId);
    if (!root) return;
    paint(
      "review-notes",
      open.map((n) => (n.quote ? findQuoteRange(root, n.quote) : null)).filter((r): r is Range => !!r),
    );
    return () => paint("review-notes", []);
  }, [bodyId, open]);

  // Watch for words highlighted inside the story.
  useEffect(() => {
    if (!bodyId || !data) return;
    const check = () => {
      const root = document.getElementById(bodyId);
      const sel = window.getSelection();
      if (!root || !sel || sel.isCollapsed || sel.rangeCount === 0) return setSelection(null);
      const range = sel.getRangeAt(0);
      if (!root.contains(range.commonAncestorContainer)) return setSelection(null);
      const quote = sel.toString().trim();
      if (quote.length < 2) return setSelection(null);
      const box = range.getBoundingClientRect();
      setSelection({ quote: quote.slice(0, 1000), x: box.left + box.width / 2, y: box.top });
    };
    document.addEventListener("mouseup", check);
    document.addEventListener("keyup", check);
    document.addEventListener("touchend", check);
    return () => {
      document.removeEventListener("mouseup", check);
      document.removeEventListener("keyup", check);
      document.removeEventListener("touchend", check);
    };
  }, [bodyId, data]);

  const startNote = useCallback((quote: string | null) => {
    setDraft({ quote });
    setBody("");
    setSuggestion("");
    setSuggest(false);
    setError(null);
    setSelection(null);
    window.setTimeout(() => {
      composer.current?.focus();
      composer.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 0);
  }, []);

  function show(note: ReviewNote) {
    if (!bodyId || !note.quote) return;
    const root = document.getElementById(bodyId);
    const range = root ? findQuoteRange(root, note.quote) : null;
    if (!range) return;
    paint("review-active", [range]);
    (range.startContainer.parentElement ?? root)?.scrollIntoView({ block: "center", behavior: "smooth" });
    window.setTimeout(() => paint("review-active", []), 2500);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!draft || !body.trim()) return;
    setError(null);
    try {
      await add.mutateAsync({ body: body.trim(), quote: draft.quote, suggestion: suggest && suggestion.trim() ? suggestion.trim() : null });
      setDraft(null);
    } catch (err) {
      setError((err as { message?: string }).message ?? "The comment did not send. Please try again.");
    }
  }

  if (!enabled || isError || !data) return null;
  const isReviewer = data.isReviewer;

  return (
    <section id="review-notes" aria-labelledby="review-notes-title" className="mt-12 scroll-mt-24">
      {selection && !draft && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => startNote(selection.quote)}
          style={{ position: "fixed", left: Math.max(8, selection.x - 60), top: Math.max(8, selection.y - 48), zIndex: 60 }}
          className="m-pill !min-h-9 !px-4 shadow-lg"
        >
          <MessageSquarePlus size={15} aria-hidden="true" /> Comment
        </button>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3 border-b m-rule pb-3">
        <div>
          <h2 id="review-notes-title" className="m-ink text-xl font-bold">
            Review notes{open.length ? ` (${open.length})` : ""}
          </h2>
          <p className="m-muted mt-1 text-[13px]">
            {isReviewer
              ? "Highlight words in the story to comment on them or suggest new wording. Notes go to the author without approving or returning the story."
              : "Private notes from your reviewers. Only you and the reviewers see them."}
          </p>
        </div>
        {!draft && (
          <button type="button" onClick={() => startNote(null)} className="m-pill-outline !min-h-9 !px-4">
            <MessageSquarePlus size={15} aria-hidden="true" /> {isReviewer ? "Comment on the whole story" : "Reply"}
          </button>
        )}
      </div>

      {draft && (
        <form onSubmit={send} className="m-paper mt-4 border m-rule p-4">
          {draft.quote && (
            <p className="m-muted border-l-2 border-[#e0b400] bg-[rgba(255,214,0,0.15)] px-3 py-1.5 text-sm italic">“{draft.quote}”</p>
          )}
          <label htmlFor="review-note-body" className="m-muted mt-3 block text-[13px]">
            {draft.quote ? "Your comment on this passage" : "Your comment"}
          </label>
          <textarea id="review-note-body" ref={composer} rows={3} maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} className="m-input mt-1 resize-y" />
          {draft.quote && isReviewer && (
            <>
              <label className="m-ink mt-3 flex min-h-11 items-center gap-2 text-sm">
                <input type="checkbox" checked={suggest} onChange={(e) => setSuggest(e.target.checked)} /> Suggest new wording
              </label>
              {suggest && (
                <>
                  <label htmlFor="review-note-suggestion" className="sr-only">
                    Suggested wording
                  </label>
                  <textarea
                    id="review-note-suggestion"
                    rows={2}
                    maxLength={2000}
                    value={suggestion}
                    onChange={(e) => setSuggestion(e.target.value)}
                    placeholder="How you would put it"
                    className="m-input m-serif resize-y"
                  />
                </>
              )}
            </>
          )}
          {error && (
            <p role="alert" className="m-ink mt-2 text-sm">
              {error}
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button type="submit" disabled={busy || !body.trim()} className="m-pill !min-h-9 !px-4">
              {add.isPending && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
              Send comment
            </button>
            <button type="button" onClick={() => setDraft(null)} className="m-pill-outline !min-h-9 !px-4">
              <X size={14} aria-hidden="true" /> Cancel
            </button>
          </div>
        </form>
      )}

      {notes.length === 0 ? (
        <p className="m-muted mt-4 text-sm">No notes yet.</p>
      ) : (
        <>
          <ul className="mt-4 space-y-3">
            {open.map((n) => (
              <NoteCard
                key={n.id}
                note={n}
                canResolve
                busy={busy}
                onShow={() => show(n)}
                onResolve={(r) => resolve.mutate({ noteId: n.id, resolved: r })}
                onDelete={() => remove.mutate(n.id)}
                onApply={
                  onApply
                    ? () => {
                        if (onApply(n)) resolve.mutate({ noteId: n.id, resolved: true });
                        else setError("The highlighted words are no longer in the story, so the suggestion could not be applied.");
                      }
                    : undefined
                }
              />
            ))}
          </ul>
          {done.length > 0 && (
            <div className="mt-4">
              <button type="button" onClick={() => setShowResolved((v) => !v)} className="m-muted min-h-11 text-sm underline">
                {showResolved ? "Hide" : "Show"} {done.length} resolved
              </button>
              {showResolved && (
                <ul className="mt-2 space-y-3">
                  {done.map((n) => (
                    <NoteCard
                      key={n.id}
                      note={n}
                      canResolve
                      busy={busy}
                      onShow={() => show(n)}
                      onResolve={(r) => resolve.mutate({ noteId: n.id, resolved: r })}
                      onDelete={() => remove.mutate(n.id)}
                    />
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
      {error && !draft && (
        <p role="alert" className="m-ink mt-3 text-sm">
          {error}
        </p>
      )}
    </section>
  );
}

/** Replaces the first occurrence of a note's quote in a draft, ignoring spacing differences. */
export function applySuggestion(body: string, quote: string, suggestion: string): string | null {
  const exact = body.indexOf(quote);
  if (exact >= 0) return body.slice(0, exact) + suggestion + body.slice(exact + quote.length);
  // The quote came from rendered text: allow any run of whitespace (and Markdown emphasis) between words.
  const words = quote.trim().split(/\s+/).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!words.length) return null;
  const pattern = new RegExp(`[*_]*${words.join("[\\s*_]+")}[*_]*`);
  const m = pattern.exec(body);
  if (!m) return null;
  return body.slice(0, m.index) + suggestion + body.slice(m.index + m[0].length);
}
