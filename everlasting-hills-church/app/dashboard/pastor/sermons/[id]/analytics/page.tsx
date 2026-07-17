import SermonEngagementDetail from "@/components/dashboard/admin/SermonEngagementDetail";
import { serverApi } from "@/lib/api/server";
import { SermonComment, CommentAuthor } from "@/lib/api/sermon-types";

export const metadata = { title: "Sermon Engagement — Dashboard" };

interface EngagementResponse {
  sermon: {
    id: string;
    title: string;
    slug: string;
    speaker: string;
    date: string;
    playCount: number;
    series: string | null;
    audioDuration: number | null;
  };
  reactions: Array<{ id: string; type: string; createdAt: string; member: CommentAuthor }>;
  bookmarks: Array<{ id: string; createdAt: string; member: CommentAuthor }>;
  notes: Array<{ id: string; content: string; createdAt: string; member: CommentAuthor }>;
  comments: SermonComment[];
  listens: Array<{ id: string; positionSec: number; completed: boolean; updatedAt: string; member: CommentAuthor }>;
  discussion: Array<{
    id: string;
    question: string;
    order: number;
    responses: Array<{ id: string; content: string; createdAt: string; member: CommentAuthor }>;
  }>;
}

/**
 * Full per-member engagement detail for a single sermon. Middleware enforces PASTOR+.
 */
export default async function SermonEngagementPage({ params }: { params: { id: string } }) {
  const data = await serverApi.get<EngagementResponse>(`/sermons/admin/${params.id}/engagement`, {
    cache: "no-store",
  });

  return <SermonEngagementDetail {...data} />;
}
