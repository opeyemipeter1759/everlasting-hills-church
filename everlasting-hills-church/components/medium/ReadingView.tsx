import type { ReactNode } from "react";
import Link from "next/link";
import RichText from "@/components/ui/display/RichText";
import { MAvatar } from "./parts";
import { storyDate } from "./story";

export interface ReadingArticle {
  title: string;
  subtitle: string | null;
  body: string;
  coverImageUrl: string | null;
  scriptureLabel: string | null;
  readingMinutes: number;
  publishedAt: string | null;
  author: { name: string; photoUrl: string | null; href?: string | null };
}

/**
 * One article, read: the Medium reading column. Serif display title, grey
 * subtitle, the author and the date, an action bar between hairlines, a
 * square cover, and the body in Charter at 20px. The same layout serves the
 * public blog and the app; the actions and what follows the body are slots.
 */
export default function ReadingView({
  article,
  notice,
  actions,
  footer,
  back,
}: {
  article: ReadingArticle;
  notice?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  back?: ReactNode;
}) {
  const a = article;
  return (
    <article className="mx-auto w-full max-w-[680px] px-4 pb-16 pt-8 xs:px-6">
      {back}
      {notice && <div className="mt-6">{notice}</div>}

      {a.scriptureLabel && <p className="m-muted mt-8 text-[13px] uppercase tracking-[0.12em]">{a.scriptureLabel}</p>}
      <h1 className="m-display m-ink mt-3 text-[34px] leading-[1.12] sm:text-[44px]">{a.title}</h1>
      {a.subtitle && <p className="m-muted mt-3 text-xl leading-snug sm:text-[22px]">{a.subtitle}</p>}

      <div className="mt-8 flex items-center gap-3">
        <MAvatar name={a.author.name} photoUrl={a.author.photoUrl} size={44} />
        <div className="min-w-0 text-sm">
          {a.author.href ? (
            <Link href={a.author.href} className="m-ink m-link font-medium">
              {a.author.name}
            </Link>
          ) : (
            <p className="m-ink font-medium">{a.author.name}</p>
          )}
          <p className="m-muted mt-0.5">
            {a.readingMinutes} min read{a.publishedAt ? ` · ${storyDate(a.publishedAt)}` : ""}
          </p>
        </div>
      </div>

      {actions && <div className="mt-8 flex items-center justify-between gap-3 border-y m-rule py-1">{actions}</div>}

      {a.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={a.coverImageUrl} alt="" className="mt-10 w-full object-cover" />
      )}

      <div className="mt-10">
        <RichText text={a.body} density="comfortable" className="m-article" emphasisClassName="m-ink" />
      </div>

      {footer}
    </article>
  );
}
