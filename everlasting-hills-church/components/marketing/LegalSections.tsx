import type { ReactNode } from "react";

export interface LegalContent {
  eyebrow: string;
  title: string;
  accent: string;
  updated: string;
  intro: string;
  sections: { heading: string; body: string }[];
}

/** Linkify bare email addresses in a line of text. */
function linkify(text: string): ReactNode {
  const parts = text.split(/([\w.+-]+@[\w-]+\.[\w.-]+)/g);
  return parts.map((part, i) =>
    /^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(part) ? (
      <a key={i} className="text-[#87102C] hover:underline" href={`mailto:${part}`}>{part}</a>
    ) : (
      part
    ),
  );
}

/** Render a section body: blank-line-separated paragraphs; lines starting "- " become a bullet list. */
function renderBody(body: string): ReactNode[] {
  const out: ReactNode[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (bullets.length) {
      out.push(
        <ul key={`u${out.length}`}>
          {bullets.map((b, i) => <li key={i}>{linkify(b)}</li>)}
        </ul>,
      );
      bullets = [];
    }
  };
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("- ")) bullets.push(line.slice(2));
    else {
      flush();
      if (line) out.push(<p key={`p${out.length}`}>{linkify(line)}</p>);
    }
  }
  flush();
  return out;
}

export default function LegalSections({ content }: { content: LegalContent }) {
  return (
    <>
      <p>{linkify(content.intro)}</p>
      {content.sections.map((s, i) => (
        <section key={i}>
          <h2>{s.heading}</h2>
          {renderBody(s.body)}
        </section>
      ))}
    </>
  );
}
