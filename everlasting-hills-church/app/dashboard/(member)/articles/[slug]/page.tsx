import ArticleReader from "@/components/dashboard/member/articles/ArticleReader";

export const metadata = { title: "Article — Dashboard" };

export default function ArticlePage({ params }: { params: { slug: string } }) {
  return <ArticleReader slug={params.slug} />;
}
