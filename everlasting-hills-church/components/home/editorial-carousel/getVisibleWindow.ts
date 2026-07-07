export interface WindowItem {
  index: number;
  offset: number;
}

/**
 * Circular window of item indices centered on `active`, capped so it never
 * wraps onto itself when `length` is small.
 */
export function getVisibleWindow(active: number, length: number, span = 2): WindowItem[] {
  const maxSpan = Math.max(0, Math.min(span, Math.floor((length - 1) / 2)));
  const result: WindowItem[] = [];
  for (let offset = -maxSpan; offset <= maxSpan; offset++) {
    const index = ((active + offset) % length + length) % length;
    result.push({ index, offset });
  }
  return result;
}
