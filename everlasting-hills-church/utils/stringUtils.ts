export function getInitials(fullName: string | null | undefined, email: string | null | undefined): string {
  const source = (fullName ?? email ?? '').trim();
  if (!source) return 'EH';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function truncateText(s: string | null | undefined, max = 24): string {
  if (!s) return '';
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}
