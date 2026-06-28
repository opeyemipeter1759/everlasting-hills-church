import { Camera } from 'lucide-react';

interface AvatarSectionProps {
  displayPhoto?: string | null;
  fullName: string;
  initials: string;
  roleLabel: string;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onAvatarChange: React.ChangeEventHandler<HTMLInputElement>;
}

export function AvatarSection({ displayPhoto, fullName, initials, roleLabel, fileInputRef, onAvatarChange }: AvatarSectionProps) {
  return (
    <div className="flex items-center gap-5 px-6 py-5 border-b border-gray-100 dark:border-white/5">
      <div className="relative flex-shrink-0">
        {displayPhoto ? (
          <img src={displayPhoto} alt={fullName} className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 dark:border-white/10" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#87102C] to-[#c0392b] flex items-center justify-center select-none">
            <span className="text-2xl font-bold text-white">{initials}</span>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" aria-label="Upload profile photo" onChange={onAvatarChange} className="hidden" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full bg-[#87102C] border-2 border-white dark:border-[#1c1c1e] flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
          title="Change photo"
        >
          <Camera size={13} className="text-white" />
        </button>
      </div>
      <div>
        <p className="text-base font-semibold text-gray-900 dark:text-white leading-tight">{fullName}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">{roleLabel}</p>
        <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-2 text-xs text-[#87102C] font-medium hover:underline">
          Change photo
        </button>
      </div>
    </div>
  );
}
