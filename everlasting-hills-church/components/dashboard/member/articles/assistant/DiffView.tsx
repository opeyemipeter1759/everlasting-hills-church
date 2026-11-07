import type { DiffPart } from "./diff";

/** Removed words struck through in red, new words in green. */
export function DiffView({ parts }: { parts: DiffPart[] }) {
  return (
    <p className="m-ink whitespace-pre-wrap font-serif text-[15px] leading-7 [overflow-wrap:anywhere]">
      {parts.map((p, i) =>
        p.kind === "same" ? (
          <span key={i}>{p.text}</span>
        ) : p.kind === "del" ? (
          <del key={i} className="rounded-sm bg-red-500/15 text-red-700 decoration-red-500/60 dark:text-red-300">
            {p.text}
          </del>
        ) : (
          <ins key={i} className="rounded-sm bg-emerald-500/15 text-emerald-800 no-underline dark:text-emerald-300">
            {p.text}
          </ins>
        ),
      )}
    </p>
  );
}
