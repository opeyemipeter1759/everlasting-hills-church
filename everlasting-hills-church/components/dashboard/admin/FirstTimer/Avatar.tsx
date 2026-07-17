import { avatarColor } from "./helpers";

export default function Avatar({ name }: { name: string }) {
  const initial = name.trim()[0]?.toUpperCase() ?? "?";
  return (
    <div
      className={`w-7 h-7 text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0 ${avatarColor(name)}`}
    >
      {initial}
    </div>
  );
}
