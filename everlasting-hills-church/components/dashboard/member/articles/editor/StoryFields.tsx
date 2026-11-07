import ArticleBodyEditor from "../ArticleBodyEditor";
import { BODY_MAX, SUBTITLE_MAX, TITLE_MAX } from "./article-form";
import { HeadingField } from "./HeadingField";

/** Title, subtitle and the story box, with the word count under the story. */
export function StoryFields({ title, subtitle, body, words, minutes, onTitle, onSubtitle, onBody }: {
  title: string;
  subtitle: string;
  body: string;
  words: number;
  minutes: number;
  onTitle: (value: string) => void;
  onSubtitle: (value: string) => void;
  onBody: (value: string) => void;
}) {
  return (
    <>
      <HeadingField
        id="article-title"
        label="Title"
        value={title}
        max={TITLE_MAX}
        placeholder="Title"
        onChange={onTitle}
        onEnter={() => document.getElementById("article-subtitle")?.focus()}
        className="m-display m-ink text-[36px] leading-[1.15] tracking-[-0.02em] sm:text-[46px]"
      />
      <HeadingField
        id="article-subtitle"
        label="Subtitle"
        value={subtitle}
        max={SUBTITLE_MAX}
        placeholder="Add a subtitle (optional)"
        onChange={onSubtitle}
        onEnter={() => document.querySelector<HTMLElement>('[aria-label="Your story"], #article-body')?.focus()}
        className="mt-4 font-sans text-[19px] leading-[1.45] text-[var(--m-gray)] sm:text-[22px]"
      />
      <ArticleBodyEditor
        value={body}
        onChange={onBody}
        maxLength={BODY_MAX}
        context={{ title, subtitle }}
        onApplyTitle={(nextTitle, nextSubtitle) => {
          onTitle(nextTitle.slice(0, TITLE_MAX));
          if (nextSubtitle.trim()) onSubtitle(nextSubtitle.slice(0, SUBTITLE_MAX));
        }}
        status={
          <span className="tabular-nums">
            {words} words · {minutes} min read
          </span>
        }
      />
    </>
  );
}
