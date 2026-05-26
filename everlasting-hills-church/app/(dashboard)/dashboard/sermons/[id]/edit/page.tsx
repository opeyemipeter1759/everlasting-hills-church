import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SermonForm from "@/components/dashboard/admin/SermonForm";
import { serverApi, type ApiError } from "@/lib/api/server";
import type { SermonDetailRaw } from "@/lib/api/sermon-types";

interface AdminSermonDetail extends SermonDetailRaw {
  audioKey: string | null;
  audioDuration: number | null;
  isFeatured: boolean;
  scheduledFor: string | null;
}

async function fetchSermon(id: string): Promise<AdminSermonDetail | null> {
  try {
    return await serverApi.get<AdminSermonDetail>(`/sermons/admin/${id}`, {
      cache: "no-store",
    });
  } catch (err) {
    if ((err as ApiError).status === 404) return null;
    throw err;
  }
}

export default async function EditSermonPage({ params }: { params: { id: string } }) {
  const sermon = await fetchSermon(params.id);
  if (!sermon) notFound();

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <Link
          href="/dashboard/sermons"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-4"
        >
          <ArrowLeft size={12} /> Back to Sermons
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Edit Sermon</h1>
      </div>
      <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-2xl p-6">
        <SermonForm
          initial={{
            id: sermon.id,
            title: sermon.title,
            speaker: sermon.speaker,
            date: sermon.date.split("T")[0],
            description: sermon.description ?? "",
            transcript: sermon.transcript ?? "",
            scriptureRef: sermon.scriptureRef ?? "",
            series: sermon.series ?? "",
            tags: sermon.tags.join(", "),
            audioUrl: sermon.audioUrl ?? "",
            audioKey: sermon.audioKey ?? "",
            audioDuration: sermon.audioDuration,
            videoUrl: sermon.videoUrl ?? "",
            status: sermon.status,
            scheduledFor: sermon.scheduledFor ? sermon.scheduledFor.slice(0, 16) : "",
            isFeatured: sermon.isFeatured,
          }}
          discussionQuestions={sermon.DiscussionQuestion.map((q) => ({
            id: q.id,
            question: q.question,
            order: q.order,
          }))}
        />
      </div>
    </div>
  );
}
