import PageEditor from "@/components/dashboard/admin/cms/PageEditor";

export const metadata = { title: "Edit page — CMS" };

export default function CmsPageEditorRoute({ params }: { params: { key: string[] } }) {
  const key = params.key.map(decodeURIComponent).join("/");
  return <PageEditor pageKey={key} />;
}
