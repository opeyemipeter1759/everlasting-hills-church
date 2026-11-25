/**
 * Every icon the site's public pages use. Only the files in this folder name
 * the icon library, so swapping libraries means changing this folder and
 * nothing else. (The list is split across a few files to stay within the
 * repo's 150-line rule.)
 *
 * - One named re-export per icon, each from its own module, so a page only
 *   ships the icons it imports (no registry that pulls every icon in).
 * - The "ssr" modules work in server and client components alike, so no file
 *   needs "use client" just to show an icon.
 * - Icons that carry meaning get a name for what they mean (meaning.ts);
 *   interface glyphs keep the library's name (glyphs-*.ts).
 * - Never add a glyph that suggests AI or magic: sparkles, wands, robots,
 *   lightning, star bursts. The lint rule refuses them.
 */
export { Icon, type IconComponent, type IconWeight } from "./Icon";
export * from "./meaning";
export * from "./glyphs-a-l";
export * from "./glyphs-m-z";
