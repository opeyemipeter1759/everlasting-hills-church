"use client";

import { BookCheck, BookOpen } from "lucide-react";
import { useMyReadBooks, useToggleBookRead } from "@/lib/api/books";

/** "I've finished this book": it counts towards the member's reading badges. */
export default function MarkAsReadButton({ bookId }: { bookId: string }) {
  const { data: read = [] } = useMyReadBooks();
  const toggle = useToggleBookRead();
  const done = read.includes(bookId);

  return (
    <button
      type="button"
      aria-pressed={done}
      disabled={toggle.isPending}
      onClick={() => toggle.mutate({ bookId, read: !done })}
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
        done
          ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
          : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5"
      }`}
    >
      {done ? <BookCheck size={13} aria-hidden="true" /> : <BookOpen size={13} aria-hidden="true" />}
      {done ? "Read" : "Mark as read"}
    </button>
  );
}
