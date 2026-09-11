import ArticleFeed from "@/components/dashboard/member/articles/ArticleFeed";

export const metadata = { title: "Articles — Dashboard" };

/**
 * Client rendered: the feed carries a per-member "have I liked this" flag, so
 * there is no version of this page that can be shared between two people.
 */
export default function ArticlesPage() {
  return <ArticleFeed />;
}
