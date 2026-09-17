"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Library } from "lucide-react";
import { useBookCollectionsFeed, useBooksFeed, type Book } from "@/lib/api/books";

function Shelf({ title, books }: { title: string; books: Book[] }) {
  return (
    <div className="mt-8 first:mt-0">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{title}</h2>
      <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {books.map((b) => (
          <Link key={b.id} href={`/dashboard/books/${b.id}`} className="group block">
            <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-gray-100 dark:bg-white/5 shadow-sm ring-1 ring-black/5 dark:ring-white/10 transition-transform group-hover:-translate-y-0.5 group-hover:shadow-md">
              {b.coverUrl ? (
                <Image
                  src={b.coverUrl}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 200px, 40vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-300 dark:text-white/20">
                  <BookOpen size={28} />
                </div>
              )}
            </div>
            <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">{b.title}</p>
            {b.author && <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5 truncate">{b.author}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * The church library, shelved by collection ("Faith", "Power", "Healing").
 * Tapping a cover opens the reader — nothing here downloads a file.
 */
export default function BooksLibrary() {
  const { data: collections = [], isLoading: collectionsLoading } = useBookCollectionsFeed();
  const { data: books = [], isLoading: booksLoading } = useBooksFeed();
  const isLoading = collectionsLoading || booksLoading;

  const { shelves, uncategorized } = useMemo(() => {
    const byCollection = new Map<string, Book[]>();
    const rest: Book[] = [];
    for (const b of books) {
      if (b.collectionId) {
        const list = byCollection.get(b.collectionId) ?? [];
        list.push(b);
        byCollection.set(b.collectionId, list);
      } else {
        rest.push(b);
      }
    }
    const shelves = collections
      .map((c) => ({ id: c.id, name: c.name, books: byCollection.get(c.id) ?? [] }))
      .filter((s) => s.books.length > 0);
    return { shelves, uncategorized: rest };
  }, [collections, books]);

  return (
    <div className="mx-auto max-w-full md:px-5 py-6">
      <header className="border-b border-gray-100 pb-6 dark:border-white/10">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-[#111] dark:text-white sm:text-4xl">
          Library
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#8a7e80] dark:text-white/45">
          Books the church is currently recommending. Tap one to read it right here.
        </p>
      </header>

      {isLoading ? (
        <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-[2/3] animate-pulse rounded-xl bg-gray-100 dark:bg-white/10" />
              <div className="h-3.5 w-3/4 animate-pulse rounded bg-gray-100 dark:bg-white/10" />
            </div>
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 py-16 text-center">
          <Library size={26} className="text-gray-300 dark:text-white/20" />
          <p className="text-sm font-semibold text-gray-600 dark:text-white/60">No books yet</p>
          <p className="text-xs text-gray-400 dark:text-white/40">Check back soon — the shelf is being stocked.</p>
        </div>
      ) : (
        <>
          {shelves.map((s) => (
            <Shelf key={s.id} title={s.name} books={s.books} />
          ))}
          {uncategorized.length > 0 && <Shelf title="More" books={uncategorized} />}
        </>
      )}
    </div>
  );
}
