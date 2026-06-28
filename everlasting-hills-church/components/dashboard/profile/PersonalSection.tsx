import { SectionHeader } from '@/components/ui/layout/SectionHeader';
import { FieldBox } from '@/components/ui/form/FieldBox';
import type { SectionProps } from './types';

interface Props extends SectionProps {
  formData: { firstName: string; lastName: string; email: string; phone: string; occupation: string; dateOfBirth: string; };
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  formatDob: (raw: string) => string;
}

export function PersonalSection({ formData, editingSection, setEditingSection, onSave, onCancel, onChange, formatDob }: Props) {
  const isEditing = editingSection === 'personal';
  return (
    <div className="px-6 pt-5 pb-6">
      <SectionHeader title="Personal Details" section="personal" editingSection={editingSection} onEdit={setEditingSection} onSave={onSave} onCancel={onCancel} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
        <FieldBox label="First Name" name="firstName" value={formData.firstName} isEditing={isEditing} onChange={onChange} />
        <FieldBox label="Last Name" name="lastName" value={formData.lastName} isEditing={isEditing} onChange={onChange} />
        <FieldBox label="Email address" name="email" type="email" value={formData.email} isEditing={isEditing} onChange={onChange} disabled />
        <FieldBox label="Phone" name="phone" value={formData.phone} isEditing={isEditing} onChange={onChange} />
        <FieldBox label="Occupation" name="occupation" value={formData.occupation} isEditing={isEditing} onChange={onChange} />
        <FieldBox
          label="Date of Birth"
          name="dateOfBirth"
          type={isEditing ? 'date' : 'text'}
          value={isEditing ? formData.dateOfBirth : formatDob(formData.dateOfBirth)}
          isEditing={isEditing}
          onChange={onChange}
        />
      </div>
    </div>
  );
}
