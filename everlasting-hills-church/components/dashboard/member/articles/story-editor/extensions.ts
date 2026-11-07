import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { SAFE_HREF } from "@/lib/article-markdown";

/** The reader has no nested lists, so Tab must not make one. */
const FlatLists = Extension.create({
  name: "flatLists",
  priority: 1000,
  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.isActive("listItem"),
      "Shift-Tab": () => this.editor.isActive("listItem"),
    };
  },
});

/**
 * Only what the reader can show: two heading levels, lists, quotes, divider,
 * bold, italic, inline code and safe links. No underline, strikethrough or
 * code blocks, which would vanish on the published page.
 */
export function storyExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      codeBlock: false,
      strike: false,
      underline: false,
      link: {
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        defaultProtocol: "https",
        isAllowedUri: (url) => SAFE_HREF.test(url),
      },
    }),
    Placeholder.configure({ placeholder: "Tell your story…" }),
    FlatLists,
  ];
}
