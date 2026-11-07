import { Link2 } from "lucide-react";
import { Kbd } from "./ToolButton";
import type { LinkEditor } from "./useLinkEditor";

/** The small card under the toolbar for adding, changing or removing a link. */
export function LinkForm({ link, onLink }: { link: LinkEditor; onLink: boolean }) {
  return (
    <form
      onSubmit={link.apply}
      className="m-paper absolute left-0 right-0 top-full mt-2 rounded-xl border m-rule p-3 font-sans shadow-[0_8px_30px_-8px_rgba(0,0,0,0.25)] sm:left-auto sm:w-[420px]"
    >
      <div className="flex items-center gap-2">
        <Link2 size={16} aria-hidden="true" className="m-muted shrink-0" />
        <label htmlFor="article-link" className="sr-only">
          Link address
        </label>
        <input
          id="article-link"
          ref={link.input}
          value={link.value}
          onChange={(e) => link.edit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              link.close();
            }
          }}
          placeholder="Paste a link, e.g. https://…"
          aria-invalid={link.error}
          aria-describedby={link.error ? "article-link-error" : undefined}
          className="m-ink min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:text-[var(--m-gray)]"
        />
        <button type="submit" className="m-pill !min-h-8 !px-3.5 text-[13px]">
          {onLink ? "Update" : "Add link"}
        </button>
      </div>
      {link.error && (
        <p id="article-link-error" role="alert" className="mt-2 text-[12px] text-[var(--m-brand)]">
          Use a web address (https://…), an email address, or a page on this site (/…).
        </p>
      )}
      <div className="mt-2 flex items-center justify-between border-t m-rule pt-2 text-[12px]">
        <span className="m-muted">
          <Kbd>Enter</Kbd> to apply · <Kbd>Esc</Kbd> to cancel
        </span>
        {onLink && (
          <button type="button" onClick={link.remove} className="m-muted hover:text-[var(--m-brand)]">
            Remove link
          </button>
        )}
      </div>
    </form>
  );
}
