"use client";

import { apiClient } from "@/lib/api/axios";

export type WritingAction = "fix" | "improve" | "rephrase" | "shorten" | "expand" | "simplify" | "titles";
export type RewriteAction = Exclude<WritingAction, "titles">;

export type WritingAssistResult =
  | { action: RewriteAction; text: string; notes: string[] }
  | { action: "titles"; titles: { title: string; subtitle: string }[] };

/**
 * The article editor's AI writing helpers. The API holds the instructions;
 * this only sends the action and the member's text. A whole story can take
 * the model a while, so this waits far longer than the client's usual 15s.
 */
export async function assistWriting(
  action: WritingAction,
  text: string,
  context: { title?: string; subtitle?: string },
  signal?: AbortSignal,
): Promise<WritingAssistResult> {
  const res = await apiClient.post<WritingAssistResult>(
    "/ai/writing-assist",
    { action, text, context },
    { timeout: 120_000, signal },
  );
  return res.data;
}
