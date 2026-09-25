export interface ErrorForDisplay {
  message?: string;
  status?: number;
  code?: string;
}

const TECHNICAL_MESSAGE =
  /^(cannot\s+(get|post|put|patch|delete)\s+\/|request failed with status code|network error|failed to fetch|fetch failed|internal server error)|\b(econnrefused|enotfound|prisma|postgres|sqlstate|stack trace)\b/i;

/**
 * Converts API and network failures into language that helps a person recover.
 * Validation and domain messages from the API are preserved; routes, stack
 * details and transport jargon are never shown in the interface.
 */
export function userMessageForError(
  error: unknown,
  fallback = "We couldn't complete that action. Please try again.",
): string {
  const value = error && typeof error === "object" ? (error as ErrorForDisplay) : {};
  const message = typeof value.message === "string" ? value.message.trim() : "";
  const status = typeof value.status === "number" ? value.status : undefined;
  const code = typeof value.code === "string" ? value.code.toUpperCase() : "";
  const connectionFailure = ["ERR_NETWORK", "ECONNABORTED", "ETIMEDOUT", "ECONNREFUSED"].includes(code);
  const technical =
    !message ||
    message.length > 240 ||
    TECHNICAL_MESSAGE.test(message) ||
    /^timeout of \d+ms exceeded$/i.test(message) ||
    connectionFailure;

  if (status === 401) return "Your session has expired. Please sign in again and retry.";
  if (status === 403) return "You don't have permission to complete this action.";
  if (status === 404 && technical) {
    return "This feature is temporarily unavailable. Please refresh the page and try again shortly.";
  }
  if (status === 405) return "This action is temporarily unavailable. Please try again shortly.";
  if (status === 408) return "The request took too long. Check your connection and try again.";
  if (status === 413) return "That file is too large. Choose a smaller file and try again.";
  if (status === 429) return "Too many attempts were made. Please wait a moment and try again.";
  // A schema mismatch is not a transient glitch and retrying will never clear
  // it: the app has been deployed ahead of its database. Saying so points
  // whoever sees it at the one action that fixes it, instead of leaving an
  // admin refreshing a screen that cannot recover on its own. No column or
  // query detail is exposed — only that the two are out of step.
  if (code === "PRISMA_P2022" || code === "PRISMA_P2021") {
    return "This feature was updated but the database has not caught up yet. The pending database migration needs to be run — retrying will not clear it.";
  }
  if (status !== undefined && status >= 500) {
    return "Something went wrong on our side. Please try again shortly.";
  }
  if (technical) {
    if (status === undefined) return "We couldn't reach the server. Check your connection and try again.";
    return fallback;
  }
  return message || fallback;
}
