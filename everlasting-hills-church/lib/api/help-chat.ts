"use client";

import { apiClient } from "@/lib/api/axios";

export interface HelpChatAnswer {
  confident: boolean;
  steps: string[];
  ctaLabel?: string;
  ctaHref?: string;
}

/**
 * HillsBot — grounded on the backend's page map, open to every signed-in
 * role. Fixed shape: the question and where/who's asking, never a raw prompt.
 */
export async function askHillsBot(
  question: string,
  context: { pathname: string; role: string },
  signal?: AbortSignal,
): Promise<HelpChatAnswer> {
  const res = await apiClient.post<HelpChatAnswer>("/ai/help-chat", { question, context }, { timeout: 25_000, signal });
  return res.data;
}
