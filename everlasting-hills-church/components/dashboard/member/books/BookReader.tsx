"use client";

import Link from "next/link";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { useBook } from "@/lib/api/books";

/**
 * Reads the PDF in-browser via the native viewer rather than forcing a
 * download — an iframe is the one thing that works the same on desktop and
 * mobile Safari without pulling in a PDF.js bundle.
 */
export default function BookReader({ id }: { id: string }) {
  const { data: book, isLoading } = useBook(id);

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-full flex-col md:px-5 py-4">
      <div className="flex items-center justify-between gap-3 pb-3">
        <Link
          href="/dashboard/books"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 dark:text-white/60 dark:hover:text-white"
        >
          <ArrowLeft size={15} /> Library
        </Link>
        {book && (
          <a
            href={book.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <Download size={13} /> Open in new tab
          </a>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-gray-400">
          <Loader2 size={22} className="animate-spin" />
        </div>
      ) : !book ? (
        <div className="flex flex-1 items-center justify-center text-sm text-gray-400 dark:text-white/40">
          This book isn&apos;t available.
        </div>
      ) : (
        <>
          <div className="pb-3">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">{book.title}</h1>
            {book.author && <p className="text-sm text-gray-500 dark:text-white/45">{book.author}</p>}
          </div>
          <div className="flex-1 overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02]">
            <iframe src={book.fileUrl} title={book.title} className="h-full w-full" />
          </div>
        </>
      )}
    </div>
  );
}
