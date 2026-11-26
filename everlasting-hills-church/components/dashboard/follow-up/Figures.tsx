"use client";

import type { Words } from "./summary-words";

/** A sentence with its figures in bold, so the numbers can be read at a glance. */
export function Figures({ words }: { words: Words }) {
  return (
    <>
      {words.map((word, i) =>
        typeof word === "number" ? (
          <strong key={i} className="font-semibold tabular-nums text-white">
            {word}
          </strong>
        ) : (
          word
        ),
      )}
    </>
  );
}
