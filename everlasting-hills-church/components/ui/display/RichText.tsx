import { Fragment, type ReactNode } from "react";
import { parseBlocks, type Block, type Inline } from "@/lib/rich-text";

/**
 * Renders the Markdown subset described in lib/rich-text.ts.
 *
 * Everything is built as React elements — no dangerouslySetInnerHTML — so
 * announcement bodies, which are user input, cannot inject markup.
 *
 * Font size and colour are inherited from the parent so the same component
 * works in a 10px dashboard card and a full-width detail modal. The two things
 * it cannot inherit are the emphasis colour (bold/headings usually want more
 * contrast than the surrounding muted body) and the link colour, which differ
 * between the always-dark public site and the theme-aware dashboard, so both
 * are props with inherit-safe defaults.
 */
export default function RichText({
  text,
  className = "",
  density = "comfortable",
  emphasisClassName = "",
  linkClassName = "text-[#87102C] dark:text-[#FFB3C1]",
}: {
  text: string;
  className?: string;
  /** "tight" for list rows and cards, "comfortable" for detail views. */
  density?: "tight" | "comfortable";
  /** Colour for bold text and headings. Defaults to inheriting the body colour. */
  emphasisClassName?: string;
  linkClassName?: string;
}) {
  const blocks = parseBlocks(text ?? "");
  if (!blocks.length) return null;

  const style = { density, emphasisClassName, linkClassName };

  return (
    // overflow-wrap:anywhere rather than break-words: announcement bodies carry
    // long share links (YouTube live URLs with ?si= tokens) which have no break
    // opportunity and otherwise force the whole card to scroll sideways on a
    // phone.
    <div
      className={`${density === "tight" ? "space-y-1.5" : "space-y-3"} [overflow-wrap:anywhere] ${className}`}
    >
      {blocks.map((block, i) => (
        <BlockNode key={i} block={block} style={style} />
      ))}
    </div>
  );
}

interface Style {
  density: "tight" | "comfortable";
  emphasisClassName: string;
  linkClassName: string;
}

function BlockNode({ block, style }: { block: Block; style: Style }) {
  switch (block.kind) {
    case "heading":
      return (
        <p
          className={`font-bold ${style.emphasisClassName} ${
            block.level === 3 ? "text-[1.08em]" : "text-[1em]"
          } ${style.density === "tight" ? "mt-2 first:mt-0" : "mt-4 first:mt-0"}`}
        >
          <InlineNodes nodes={block.children} style={style} />
        </p>
      );

    case "list": {
      const items = block.items.map((item, i) => (
        <li key={i}>
          <InlineNodes nodes={item} style={style} />
        </li>
      ));
      return block.ordered ? (
        <ol className="list-decimal space-y-1 pl-5">{items}</ol>
      ) : (
        <ul className="list-disc space-y-1 pl-5">{items}</ul>
      );
    }

    case "quote":
      return (
        <blockquote className="border-l-2 border-gray-300 pl-3 italic opacity-90 dark:border-white/20">
          <InlineNodes nodes={block.children} style={style} />
        </blockquote>
      );

    case "rule":
      return <hr className="border-gray-200 dark:border-white/10" />;

    case "paragraph":
    default:
      // whitespace-pre-line keeps the author's single newlines, which is how
      // "Date: … / Time: … / Venue: …" blocks stay on separate lines.
      return (
        <p className="whitespace-pre-line">
          <InlineNodes nodes={block.children} style={style} />
        </p>
      );
  }
}

function InlineNodes({ nodes, style }: { nodes: Inline[]; style: Style }): ReactNode {
  return (
    <>
      {nodes.map((node, i) => (
        <Fragment key={i}>{renderInline(node, style)}</Fragment>
      ))}
    </>
  );
}

function renderInline(node: Inline, style: Style): ReactNode {
  switch (node.kind) {
    case "bold":
      return (
        <strong className={`font-bold ${style.emphasisClassName}`}>
          <InlineNodes nodes={node.children} style={style} />
        </strong>
      );
    case "italic":
      return (
        <em className="italic">
          <InlineNodes nodes={node.children} style={style} />
        </em>
      );
    case "code":
      return (
        <code className="rounded bg-gray-500/10 px-1 py-0.5 font-mono text-[0.9em]">{node.text}</code>
      );
    case "link":
      return (
        <a
          href={node.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`font-semibold underline underline-offset-2 ${style.linkClassName}`}
        >
          <InlineNodes nodes={node.children} style={style} />
        </a>
      );
    case "text":
    default:
      return node.text;
  }
}
