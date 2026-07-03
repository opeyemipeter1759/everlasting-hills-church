import SermonHeading from '@/components/sermons/Adminsermon/SermonHeading';
import SermonList from '@/components/sermons/Adminsermon/SermonList';

export const metadata = { title: 'Sermons — Everlasting Hills Church' };

export default function SermonsPage() {
  return (
    <div className="space-y-6">
      <SermonHeading />
      <SermonList />
    </div>
  );
}
