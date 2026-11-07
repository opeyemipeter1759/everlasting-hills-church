"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { SAFE_HREF } from "@/lib/article-markdown";

/** Accepts "example.org" and email addresses as well as full links. */
export function normaliseHref(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (SAFE_HREF.test(value)) return value;
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(value)) return `https://${value}`;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `mailto:${value}`;
  return null;
}

/** State and actions for the link box (Ctrl+K or the link button). */
export function useLinkEditor(editor: Editor | null) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  function show() {
    if (!editor) return;
    setValue((editor.getAttributes("link").href as string | undefined) ?? "");
    setError(false);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    editor?.commands.focus();
  }

  function remove() {
    editor?.chain().focus().extendMarkRange("link").unsetLink().run();
    setOpen(false);
  }

  function apply(event: React.FormEvent) {
    event.preventDefault();
    if (!editor) return;
    if (!value.trim()) return remove();
    const href = normaliseHref(value);
    if (!href) return setError(true);
    const chain = editor.chain().focus().extendMarkRange("link");
    if (editor.state.selection.empty && !editor.isActive("link")) {
      // Nothing selected: the address itself becomes the link text.
      chain.insertContent({ type: "text", text: href, marks: [{ type: "link", attrs: { href } }] }).run();
    } else {
      chain.setLink({ href }).run();
    }
    setOpen(false);
  }

  const edit = (next: string) => {
    setValue(next);
    setError(false);
  };

  return { open, setOpen, value, edit, error, input, show, close, remove, apply };
}

export type LinkEditor = ReturnType<typeof useLinkEditor>;
