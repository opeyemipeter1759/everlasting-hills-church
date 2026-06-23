import { Pencil, Check, X } from 'lucide-react';

export function SectionHeader<T extends string>({ title, section, editingSection, onEdit, onSave, onCancel }: {
  title: string;
  section: T;
  editingSection: T | null;
  onEdit: (s: T) => void;
  onSave: (s: T) => void;
  onCancel: (s: T) => void;
}) {
  const isEditing = editingSection === section;
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h2>
      {isEditing ? (
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onCancel(section)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            <X size={12} /> Cancel
          </button>
          <button type="button" onClick={() => onSave(section)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#87102C] text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all">
            <Check size={12} /> Save
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => onEdit(section)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
          <Pencil size={12} /> Edit
        </button>
      )}
    </div>
  );
}
