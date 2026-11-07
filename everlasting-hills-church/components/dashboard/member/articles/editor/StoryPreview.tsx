import RichText from "@/components/ui/display/RichText";

/** The story as readers will see it. */
export function StoryPreview({ title, subtitle, body, words, minutes }: {
  title: string;
  subtitle: string;
  body: string;
  words: number;
  minutes: number;
}) {
  return (
    <article>
      <h1 className="m-display m-ink text-[34px] leading-[1.12] sm:text-[44px]">{title || "Untitled"}</h1>
      {subtitle.trim() && <p className="m-muted mt-3 text-[22px] leading-snug">{subtitle}</p>}
      <p className="m-muted mt-4 text-sm">
        {minutes} min read · {words} words
      </p>
      <div className="mt-8">
        {body.trim() ? (
          <RichText text={body} density="comfortable" className="m-article" emphasisClassName="m-ink" />
        ) : (
          <p className="m-muted italic">Nothing written yet.</p>
        )}
      </div>
    </article>
  );
}
