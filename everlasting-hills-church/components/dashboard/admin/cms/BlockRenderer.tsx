import type { Block } from "./cms-blocks";

/**
 * Renders a CMS block array using the brand design system. Shared by the editor
 * preview pane and the public /preview page. Each block maps to one component —
 * no arbitrary HTML.
 */
export default function BlockRenderer({ blocks }: { blocks: Block[] }) {
  if (!blocks.length) {
    return <p className="text-center text-gray-400 py-12">Nothing here yet.</p>;
  }
  return (
    <div className="prose-cms space-y-5">
      {blocks.map((b) => (
        <BlockView key={b.id} block={b} />
      ))}
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "heading":
      return block.level === 2 ? (
        <h2 className="text-3xl font-bold tracking-tight text-[#111] dark:text-white">{block.text}</h2>
      ) : (
        <h3 className="text-2xl font-bold tracking-tight text-[#111] dark:text-white">{block.text}</h3>
      );
    case "paragraph":
      return <p className="text-base leading-relaxed text-[#444] dark:text-white/70 whitespace-pre-wrap">{block.text}</p>;
    case "image":
      return block.url ? (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.url} alt={block.alt} className="w-full rounded-2xl border border-[#E7CDD3]/60" />
          {block.caption && <figcaption className="mt-2 text-center text-sm text-gray-400">{block.caption}</figcaption>}
        </figure>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#E7CDD3] py-12 text-center text-sm text-gray-400">
          Image: {block.alt || "no image selected"}
        </div>
      );
    case "quote":
      return (
        <blockquote className="border-l-4 border-[#87102C] pl-5 py-1 italic text-lg text-[#333] dark:text-white/80">
          {block.text}
          {block.cite && <cite className="block mt-2 not-italic text-sm text-gray-400">— {block.cite}</cite>}
        </blockquote>
      );
    case "list":
      return block.ordered ? (
        <ol className="list-decimal pl-6 space-y-1 text-[#444] dark:text-white/70">
          {block.items.filter(Boolean).map((it, i) => <li key={i}>{it}</li>)}
        </ol>
      ) : (
        <ul className="list-disc pl-6 space-y-1 text-[#444] dark:text-white/70">
          {block.items.filter(Boolean).map((it, i) => <li key={i}>{it}</li>)}
        </ul>
      );
    case "divider":
      return <hr className="border-t border-[#E7CDD3]/60 my-8" />;
    case "video": {
      const embed = toEmbedUrl(block.url);
      return embed ? (
        <div className="aspect-video w-full overflow-hidden rounded-2xl border border-[#E7CDD3]/60">
          <iframe src={embed} className="h-full w-full" allowFullScreen title="Video" />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#E7CDD3] py-8 text-center text-sm text-gray-400">Video: {block.url || "no URL"}</div>
      );
    }
    case "cta":
      return (
        <div>
          <a href={block.href || "#"} className="inline-flex items-center rounded-full bg-[#87102C] px-7 py-3 text-sm font-semibold text-white">
            {block.label || "Button"}
          </a>
        </div>
      );
    case "featuredSermon":
      return <RefCard label="Featured sermon" value={block.sermonId} />;
    case "featuredEvent":
      return <RefCard label="Featured event" value={block.eventId} />;
    default:
      return null;
  }
}

function RefCard({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-2xl border border-[#E7CDD3]/60 bg-[#FFF4F6]/50 px-5 py-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#87102C]">{label}</p>
      <p className="text-sm text-gray-500 mt-1">{value ? `Resolves ${value} at render time` : "None selected"}</p>
    </div>
  );
}

/** Convert a YouTube/Vimeo watch URL to an embeddable one; pass through others. */
function toEmbedUrl(url: string): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vim = url.match(/vimeo\.com\/(\d+)/);
  if (vim) return `https://player.vimeo.com/video/${vim[1]}`;
  if (/^https?:\/\//.test(url)) return url;
  return null;
}
