import type { LucideIcon } from "lucide-react";
import { Wrench } from "lucide-react";

type Props = {
  title: string;
  description?: string;
  icon?: LucideIcon;
};

export default function ComingSoon({ title, description, icon: Icon = Wrench }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] text-center px-6">
      <div className="w-14 h-14 rounded-2xl bg-brand-blush border border-brand-rose flex items-center justify-center mb-5">
        <Icon size={22} className="text-burgundy" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
        {description ?? "This section is currently being built. Check back soon."}
      </p>
    </div>
  );
}
