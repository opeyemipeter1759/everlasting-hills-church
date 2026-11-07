"use client";

import { useEffect, useState } from "react";

export type Mode = "visual" | "markdown";
const MODE_KEY = "ehc.article-editor-mode";

/** Write or Markdown, remembered on this device. */
export function useEditorMode() {
  const [mode, setMode] = useState<Mode>("visual");
  useEffect(() => {
    try {
      if (window.localStorage.getItem(MODE_KEY) === "markdown") setMode("markdown");
    } catch {
      // Storage blocked: start in the editor.
    }
  }, []);
  const choose = (next: Mode) => {
    setMode(next);
    try {
      window.localStorage.setItem(MODE_KEY, next);
    } catch {
      // Not remembered; nothing else is lost.
    }
  };
  return [mode, choose] as const;
}

/** "⌘" on Apple devices, "Ctrl" elsewhere, for shortcut hints. */
export function useModKey() {
  const [mod, setMod] = useState("Ctrl");
  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) setMod("⌘");
  }, []);
  return mod;
}
