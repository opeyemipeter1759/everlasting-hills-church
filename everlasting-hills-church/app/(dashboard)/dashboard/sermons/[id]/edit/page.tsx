import SermonForm from '@/components/sermons/Adminsermon/SermonForm';

export const metadata = { title: 'Edit Sermon — Everlasting Hills Church' };

export default function EditSermonPage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <SermonForm mode="edit" />
    </div>
  );
}
