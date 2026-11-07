/** Same rule as the reader: only these become clickable. */
export const SAFE_HREF = /^(?:https?:\/\/|mailto:|\/)/i;

/** A whole string that the reader would turn into a link by itself. */
export const WHOLE_BARE_URL = /^https?:\/\/[^\s<>()]+[^\s<>().,;:!?"\x27]$/i;
