import SermonForm from '@/components/sermons/Adminsermon/SermonForm';

export const metadata = { title: 'Edit Sermon — Everlasting Hills Church' };

export default function EditSermonPage() {
  return (
    <div className="px-0 py-2 sm:px-2 lg:px-4">
      <SermonForm mode="edit" />
    </div>
  );
}
