/**
 * What an error report may carry. It is for finding the bug, so it never
 * carries what a request contained (body, cookies, query string), and any
 * extra data or breadcrumb data whose key names a pre-marital counselling
 * answer or another member's private words is removed.
 */
const PRIVATE_KEY =
  /^(applicant|partner)(first|last)?(name|email|phone)?$|^(applicant|partner)(FirstName|LastName|Email|Phone)$|^(intro|adminNote|weddingDate|membership|preferredContact|partnerConsentToContact|privacyAcknowledged|reason|note|prayerPoint|request|body|summary)$/i;

type Bag = Record<string, unknown> | undefined;

function scrubBag(bag: Bag): void {
  if (!bag) return;
  for (const key of Object.keys(bag)) {
    if (PRIVATE_KEY.test(key)) delete bag[key];
    else if (
      bag[key] &&
      typeof bag[key] === 'object' &&
      !Array.isArray(bag[key])
    )
      scrubBag(bag[key] as Record<string, unknown>);
  }
}

export interface ScrubbableEvent {
  request?: {
    data?: unknown;
    cookies?: unknown;
    query_string?: unknown;
    [k: string]: unknown;
  };
  extra?: Record<string, unknown>;
  contexts?: Record<string, Record<string, unknown> | undefined>;
  breadcrumbs?: { data?: Record<string, unknown>; [k: string]: unknown }[];
}

export function scrubEvent<E>(input: E): E {
  const event = input as unknown as ScrubbableEvent;
  if (event.request) {
    delete event.request.data;
    delete event.request.cookies;
    delete event.request.query_string;
  }
  scrubBag(event.extra);
  for (const ctx of Object.values(event.contexts ?? {})) scrubBag(ctx);
  for (const crumb of event.breadcrumbs ?? []) scrubBag(crumb.data);
  return input;
}
