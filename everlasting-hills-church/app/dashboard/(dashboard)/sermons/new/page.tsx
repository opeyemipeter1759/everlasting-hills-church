import SermonForm from '@/components/sermons/Adminsermon/SermonForm';

export const metadata = { title: 'New Sermon — Everlasting Hills Church' };

export default function NewSermonPage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <SermonForm mode="create" />
    </div>
  );
}
