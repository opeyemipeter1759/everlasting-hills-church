"use client";

import Link from "next/link";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { useBook } from "@/lib/api/books";
import BookComments from "./BookComments";
import BookShareButton from "./BookShareButton";

/**
 * Reads the PDF in-browser via the native viewer rather than forcing a
 * download — an iframe is the one thing that works the same on desktop and
 * mobile Safari without pulling in a PDF.js bundle.
 */
export default function BookReader({ id }: { id: string }) {
  const { data: book, isLoading } = useBook(id);

  return (
    <div className="mx-auto max-w-full md:px-5 py-4">
      <div className="flex items-center justify-between gap-3 pb-3">
        <Link
          href="/dashboard/books"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 dark:text-white/60 dark:hover:text-white"
        >
          <ArrowLeft size={15} /> Library
        </Link>
        {book && (
          <div className="flex items-center gap-2">
            <BookShareButton book={book} variant="button" />
            <a
              href={book.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <Download size={13} /> <span className="hidden sm:inline">Open in new tab</span><span className="sm:hidden">Open</span>
            </a>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-[calc(100vh-9rem)] items-center justify-center text-gray-400">
          <Loader2 size={22} className="animate-spin" />
        </div>
      ) : !book ? (
        <div className="flex h-[calc(100vh-9rem)] items-center justify-center text-sm text-gray-400 dark:text-white/40">
          This book isn&apos;t available.
        </div>
      ) : (
        <div className="space-y-5">
          <div className="pb-1">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">{book.title}</h1>
            {book.author && <p className="text-sm text-gray-500 dark:text-white/45">{book.author}</p>}
          </div>
          <div className="h-[75vh] overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02]">
            <iframe src={book.fileUrl} title={book.title} className="h-full w-full" />
          </div>
          <BookComments bookId={book.id} />
        </div>
      )}
    </div>
  );
}
