export function SocialFieldBox({ label, name, icon, placeholder, value, isEditing, onChange }: {
  label: string;
  name: string;
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  isEditing: boolean;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
        {label}
      </label>
      {isEditing ? (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">{icon}</span>
          <input
            id={name}
            type="url"
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#87102C]/30 focus:border-[#87102C]/40 transition-all"
          />
        </div>
      ) : (
        <div className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-transparent min-h-[40px] flex items-center gap-2">
          {icon}
          {value ? (
            <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-[#87102C] hover:underline truncate">
              {value}
            </a>
          ) : (
            <span className="text-sm text-gray-400">Not set</span>
          )}
        </div>
      )}
    </div>
  );
}
