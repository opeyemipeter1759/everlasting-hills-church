import { SectionHeader } from '@/components/ui/layout/SectionHeader';
import type { SectionProps } from './types';

interface Props extends SectionProps {
  bio: string;
  onChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
}

export function AboutSection({ bio, editingSection, setEditingSection, onSave, onCancel, onChange }: Props) {
  const isEditing = editingSection === 'about';
  return (
    <div className="px-6 pt-5 pb-6">
      <SectionHeader title="About" section="about" editingSection={editingSection} onEdit={setEditingSection} onSave={onSave} onCancel={onCancel} />
      {isEditing ? (
        <>
          <label htmlFor="bio" className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Bio</label>
          <textarea
            id="bio"
            name="bio"
            value={bio}
            onChange={onChange}
            rows={4}
            placeholder="Write a short bio..."
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#87102C]/30 focus:border-[#87102C]/40 transition-all resize-none"
          />
        </>
      ) : (
        <div className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-transparent min-h-[72px]">
          {bio ? (
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{bio}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">No bio added yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
