export function HeroAvatar({ photoUrl, displayName, initials }: {
  photoUrl: string | null;
  displayName: string;
  initials: string;
}) {
  return (
    <div className="flex-shrink-0 self-start sm:self-center">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt={`${displayName}'s profile photo`}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover
            ring-4 ring-white/20 shadow-2xl shadow-black/40"
        />
      ) : (
        <div
          aria-hidden="true"
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl
            bg-white/10 border border-white/20 flex items-center justify-center
            text-3xl sm:text-4xl font-extrabold text-white
            ring-4 ring-white/15 shadow-2xl shadow-black/30"
        >
          {initials}
        </div>
      )}
    </div>
  );
}
