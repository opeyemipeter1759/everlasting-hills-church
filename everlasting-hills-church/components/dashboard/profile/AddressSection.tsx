import { SectionHeader } from '@/components/ui/layout/SectionHeader';
import { FieldBox } from '@/components/ui/form/FieldBox';
import type { SectionProps } from './types';

interface Props extends SectionProps {
  formData: { address: string; state: string; country: string; };
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}

export function AddressSection({ formData, editingSection, setEditingSection, onSave, onCancel, onChange }: Props) {
  const isEditing = editingSection === 'address';
  return (
    <div className="px-6 pt-5 pb-6">
      <SectionHeader title="Address" section="address" editingSection={editingSection} onEdit={setEditingSection} onSave={onSave} onCancel={onCancel} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
        <div className="sm:col-span-2">
          <FieldBox label="Street Address" name="address" value={formData.address} isEditing={isEditing} onChange={onChange} />
        </div>
        <FieldBox label="State / Province" name="state" value={formData.state} isEditing={isEditing} onChange={onChange} />
        <FieldBox label="Country" name="country" value={formData.country} isEditing={isEditing} onChange={onChange} />
      </div>
    </div>
  );
}
