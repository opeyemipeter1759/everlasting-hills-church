import LessonPlayerClient from "@/components/classes/LessonPlayerClient";

export const metadata = { title: "Lesson | Dashboard" };

/** The week is in the address for readability; the lesson slug alone identifies it. */
export default function LessonPage({ params }: { params: { slug: string; week: string; lesson: string } }) {
  return <LessonPlayerClient slug={params.slug} lesson={params.lesson} />;
}
