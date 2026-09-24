import type { MasterListRow, MasterListStatus } from './master-list.util';
import type { AgreedStatus } from './status-override.util';

export interface RollRow extends MasterListRow {
  statusAwaitingApproval: MasterListStatus | null;
}

/**
 * A status the team agreed beats the one worked out from attendance — but
 * only until something happens afterwards. Somebody marked integrated who
 * then stops coming is surfaced as away again, which is the whole point of
 * the Integration Team watching them.
 */
export function settle(
  rows: MasterListRow[],
  agreed: Map<string, AgreedStatus>,
  waiting: Map<string, AgreedStatus>,
): RollRow[] {
  return rows.map((row) => {
    const agreedStatus = agreed.get(row.id);
    const supersededBy = row.latestEntryAt ? new Date(row.latestEntryAt) : null;
    const stillStands = !!agreedStatus && (!supersededBy || agreedStatus.at >= supersededBy);

    return {
      ...row,
      status: stillStands && agreedStatus ? agreedStatus.status : row.status,
      statusAwaitingApproval: waiting.get(row.id)?.status ?? null,
    };
  });
}
