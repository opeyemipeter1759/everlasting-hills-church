import SermonForm from "@/components/dashboard/admin/SermonForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewSermonPage() {
  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <Link href="/dashboard/sermons"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-4">
          <ArrowLeft size={12} /> Back to Sermons
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">New Sermon</h1>
      </div>
      <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-2xl p-6">
        <SermonForm />
      </div>
    </div>
  );
}
