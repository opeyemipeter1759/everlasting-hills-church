export function FieldBox({ label, name, type = 'text', value, isEditing, onChange, disabled }: {
  label: string;
  name: string;
  type?: string;
  value: string;
  isEditing: boolean;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
        {label}
      </label>
      {isEditing ? (
        <input
          id={name}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#87102C]/30 focus:border-[#87102C]/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-white/5"
        />
      ) : (
        <div className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-transparent min-h-[40px] flex items-center">
          {value ? (
            <span className="text-sm text-gray-800 dark:text-gray-200">{value}</span>
          ) : (
            <span className="text-sm text-gray-400">Not set</span>
          )}
        </div>
      )}
    </div>
  );
}
