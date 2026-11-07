import Link from "next/link";
import { MediumPage } from "../ArticleTabs";

export function EditorLoading() {
  return (
    <MediumPage>
      <div className="mx-auto max-w-[740px] space-y-5 pt-12" aria-busy="true">
        <div className="m-paper h-12 w-3/4 animate-pulse" />
        <div className="m-paper h-72 animate-pulse" />
      </div>
    </MediumPage>
  );
}

export function EditorNotFound() {
  return (
    <MediumPage>
      <p role="alert" className="m-ink mx-auto max-w-[740px] py-12 text-sm">
        This story could not be opened for editing.{" "}
        <Link href="/dashboard/articles/mine" className="underline">
          Back to your stories
        </Link>
      </p>
    </MediumPage>
  );
}
