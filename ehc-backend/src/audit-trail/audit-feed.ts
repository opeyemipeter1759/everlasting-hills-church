import { cleanSummary } from './audit-rules';
import type { AuditTarget } from './audit-targets';

export const REQUEST = 'REQUEST';
/** A service's own audit rows are written during the request, so they land just before its trail row. */
export const MERGE_WINDOW_MS = 30_000;

export interface AuditRow {
  id: string;
  actorId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  before: unknown;
  after: unknown;
  createdAt: Date;
}

export interface FeedRecord {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  before: unknown;
  after: unknown;
  at: string;
}

export interface FeedItem {
  id: string;
  at: string;
  actorId: string | null;
  actorName: string | null;
  /** request: something a person did through the dashboard. record: a change a service logged on its own. */
  kind: 'request' | 'record';
  area: string;
  summary: string;
  method: string | null;
  targets: AuditTarget[];
  params: Record<string, string> | null;
  body: unknown;
  bodyHidden: boolean;
  /** The record snapshots logged by the service while doing it (before/after), when there are any. */
  records: FeedRecord[];
}

const newestFirst = (a: AuditRow, b: AuditRow) => b.createdAt.getTime() - a.createdAt.getTime() || (a.id < b.id ? 1 : -1);

/** Which request row each service-written row belongs to: the same person's next request, within the window. */
function owners(rows: AuditRow[]): Map<string, string> {
  const open = new Map<string, AuditRow>();
  const owner = new Map<string, string>();
  for (const r of rows) {
    if (!r.actorId) continue;
    if (r.action === REQUEST) {
      open.set(r.actorId, r);
      continue;
    }
    const req = open.get(r.actorId);
    if (req && req.createdAt.getTime() - r.createdAt.getTime() <= MERGE_WINDOW_MS) owner.set(r.id, req.id);
  }
  return owner;
}

const toRecord = (r: AuditRow): FeedRecord => ({
  id: r.id, action: r.action, entity: r.entity, entityId: r.entityId, before: r.before ?? null, after: r.after ?? null, at: r.createdAt.toISOString(),
});

/** "APPROVAL_DECIDED" + "ApprovalRequest" → "Approval decided: approval request". */
export function recordSummary(action: string, entity: string): string {
  const verb = action.toLowerCase().replace(/_/g, ' ');
  const thing = entity.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  return `${verb.charAt(0).toUpperCase()}${verb.slice(1)}: ${thing}`;
}

function requestItem(r: AuditRow, records: FeedRecord[]): Omit<FeedItem, 'actorName'> {
  const a = (r.after ?? {}) as Record<string, unknown>;
  const method = typeof a.method === 'string' ? a.method : null;
  const route = typeof a.route === 'string' ? a.route : '';
  return {
    id: r.id, at: r.createdAt.toISOString(), actorId: r.actorId, kind: 'request', area: r.entity,
    summary: cleanSummary(typeof a.summary === 'string' ? a.summary : undefined, method ?? '', route),
    method,
    targets: Array.isArray(a.targets) ? (a.targets as AuditTarget[]) : [],
    params: (a.params as Record<string, string>) ?? null,
    body: a.body ?? null,
    bodyHidden: a.bodyHidden === true,
    records,
  };
}

function recordItem(r: AuditRow): Omit<FeedItem, 'actorName'> {
  return {
    id: r.id, at: r.createdAt.toISOString(), actorId: r.actorId, kind: 'record', area: r.entity,
    summary: recordSummary(r.action, r.entity), method: null, targets: [], params: null, body: null, bodyHidden: false,
    records: [toRecord(r)],
  };
}

/**
 * One line per thing a person did. `page` is the rows the filters picked;
 * `nearby` is the same people's rows just around them, so a service row on the
 * page is folded into its request even when the request sits on the next page.
 * A service row whose request is elsewhere is dropped (that request shows it),
 * unless `surface` is on (a search matched the service row only): then its
 * request is shown here instead.
 */
export function buildFeed(page: AuditRow[], nearby: AuditRow[], opts: { surface: boolean }): Omit<FeedItem, 'actorName'>[] {
  const onPage = new Set(page.map((r) => r.id));
  const all = [...new Map([...page, ...nearby].map((r) => [r.id, r])).values()].sort(newestFirst);
  const owner = owners(all);

  const shown = new Set<string>();
  for (const r of all) {
    if (r.action === REQUEST && onPage.has(r.id)) shown.add(r.id);
    const o = owner.get(r.id);
    if (o && onPage.has(r.id) && opts.surface) shown.add(o);
  }

  const records = new Map<string, FeedRecord[]>();
  for (const r of all) {
    const o = owner.get(r.id);
    if (o) records.set(o, [...(records.get(o) ?? []), toRecord(r)]);
  }

  const items: Omit<FeedItem, 'actorName'>[] = [];
  for (const r of all) {
    if (r.action === REQUEST) {
      if (shown.has(r.id)) items.push(requestItem(r, records.get(r.id) ?? []));
    } else if (!owner.has(r.id) && onPage.has(r.id)) {
      items.push(recordItem(r));
    }
  }
  return items;
}
