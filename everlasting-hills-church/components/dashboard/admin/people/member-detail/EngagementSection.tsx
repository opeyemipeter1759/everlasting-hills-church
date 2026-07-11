import { Empty, ScoreBar } from "./shared";
import type { MemberDetail } from "./types";

export default function EngagementSection({ score }: { score: MemberDetail["EngagementScore"] }) {
  if (!score) return <Empty>No engagement score computed yet.</Empty>;
  return (
    <>
      <div className="flex items-end gap-2 mb-3">
        <span className="text-3xl font-bold text-[#87102C] dark:text-[#e8768a] tabular-nums">{score.score}</span>
        <span className="text-xs text-gray-400 dark:text-white/40 mb-1.5">overall score</span>
      </div>
      <ScoreBar label="Attendance" value={score.attendanceScore} />
      <ScoreBar label="Sermons" value={score.sermonScore} />
      <ScoreBar label="Giving" value={score.givingScore} />
      <ScoreBar label="Community" value={score.communityScore} />
    </>
  );
}
