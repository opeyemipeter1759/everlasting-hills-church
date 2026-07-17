import { Quote } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-12 text-center">
      <Quote size={28} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No testimonials yet</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
        Click <span className="font-semibold text-[#87102C]">New testimonial</span> to add the first one.
      </p>
    </div>
  );
}
