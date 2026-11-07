import { Feather, Maximize2, Minimize2, Repeat2, SpellCheck, Wand2, type LucideIcon } from "lucide-react";
import type { RewriteAction, WritingAction, WritingAssistResult } from "@/lib/api/writing-assist";

/** The rewrites the assistant offers, in menu order. */
export const AI_ACTIONS: { action: RewriteAction; label: string; hint: string; busy: string; Icon: LucideIcon }[] = [
  { action: "fix", label: "Fix spelling & grammar", hint: "Correct mistakes, keep your words", busy: "Checking spelling and grammar…", Icon: SpellCheck },
  { action: "improve", label: "Improve writing", hint: "Clearer, smoother, more engaging", busy: "Improving the writing…", Icon: Wand2 },
  { action: "rephrase", label: "Paraphrase", hint: "Same meaning, different words", busy: "Paraphrasing…", Icon: Repeat2 },
  { action: "simplify", label: "Simplify language", hint: "Plain English anyone can follow", busy: "Simplifying…", Icon: Feather },
  { action: "shorten", label: "Make shorter", hint: "Keep the main points", busy: "Making it shorter…", Icon: Minimize2 },
  { action: "expand", label: "Make longer", hint: "Develop your ideas further", busy: "Developing it further…", Icon: Maximize2 },
];

export const TITLES_BUSY = "Reading your story for titles…";

/** What the AI works on, and how to put its answer back. */
export interface AssistTarget {
  /** "selection" or "story", for the panel's label. */
  scope: "selection" | "story";
  text: string;
  /** Replace the original with the suggestion. Returns false when the original moved. */
  replace: (markdown: string) => boolean;
  /** Put the suggestion after the original, keeping both. Not offered for the whole story. */
  insertAfter?: (markdown: string) => boolean;
}

export type Job =
  | { status: "loading"; action: WritingAction; target: AssistTarget }
  | { status: "error"; action: WritingAction; target: AssistTarget; message: string }
  | { status: "done"; action: WritingAction; target: AssistTarget; result: WritingAssistResult };

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}
