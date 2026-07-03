import type { CommentAuthor } from '@/lib/api/sermon-types';

export function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function Avatar({ member, className = 'w-7 h-7 text-[10px]' }: { member: CommentAuthor; className?: string }) {
  if (member.photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={member.photoUrl} alt="" className={`rounded-full object-cover shrink-0 ${className}`} />;
  }
  return (
    <div className={`rounded-full bg-[#87102C]/10 dark:bg-[#87102C]/20 flex items-center justify-center shrink-0 font-black text-[#87102C] dark:text-[#e8768a] ${className}`}>
      {initials(member.firstName, member.lastName)}
    </div>
  );
}
