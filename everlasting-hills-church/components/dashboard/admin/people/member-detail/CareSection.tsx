import { CareChip, Empty } from "./shared";
import type { MemberDetail } from "./types";

export default function CareSection({
  asMember,
  asLeader,
}: {
  asMember: MemberDetail["CareAsMember"];
  asLeader: MemberDetail["CareAsLeader"];
}) {
  return (
    <>
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-2">
        Shepherded by
      </p>
      {asMember.length === 0 ? (
        <Empty>Not assigned to a leader.</Empty>
      ) : (
        <div className="space-y-2 mb-4">
          {asMember.map((c) => (
            <CareChip key={c.id} person={c.Leader} />
          ))}
        </div>
      )}
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-2 mt-3">
        Shepherding
      </p>
      {asLeader.length === 0 ? (
        <Empty>Not assigned anyone to shepherd.</Empty>
      ) : (
        <div className="space-y-2">
          {asLeader.map((c) => (
            <CareChip key={c.id} person={c.Member} />
          ))}
        </div>
      )}
    </>
  );
}
