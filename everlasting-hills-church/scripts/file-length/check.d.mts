export const MAX_LINES: number;
export const ROOT: string;

export interface CheckResult {
  tooLong: { path: string; lines: number }[];
  grew: { path: string; lines: number; allowed: number }[];
  fixed: { path: string; lines: number }[];
  gone: string[];
  ok: boolean;
}

export function countLines(text: string): number;
export function measure(root?: string): Record<string, number>;
export function readBaseline(): Record<string, number>;
export function check(sizes: Record<string, number>, baseline: Record<string, number>, max?: number): CheckResult;
export function shrinkBaseline(
  sizes: Record<string, number>,
  baseline: Record<string, number>,
  max?: number,
): Record<string, number>;
