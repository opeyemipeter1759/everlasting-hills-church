import ClassHomeClient from "@/components/classes/ClassHomeClient";

export const metadata = { title: "Class | Dashboard" };

export default function ClassHomePage({ params }: { params: { slug: string } }) {
  return <ClassHomeClient slug={params.slug} />;
}
