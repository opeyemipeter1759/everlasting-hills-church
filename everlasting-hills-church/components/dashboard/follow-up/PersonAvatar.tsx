import type { PersonRef } from "@/types/follow-up";

const SIZE_CLASSES = {
  sm: "w-7 h-7 text-[10px]",
  md: "w-9 h-9 text-xs",
} as const;

export function PersonAvatar({ person, size = "md" }: { person: PersonRef; size?: keyof typeof SIZE_CLASSES }) {
  return (
    <div
      className={`${SIZE_CLASSES[size]} rounded-full bg-gradient-to-br from-[#87102C] to-[#6E0C24] flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden`}
    >
      {person.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={person.photoUrl} alt={person.name} className="w-full h-full object-cover" />
      ) : (
        person.name.charAt(0).toUpperCase()
      )}
    </div>
  );
}
