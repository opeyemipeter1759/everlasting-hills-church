import Link from 'next/link';

interface HeaderProps {
  Heading: string;
  link?: string;
}
export default function Header({ Heading, link = '#' }: HeaderProps) {
  return (
    <div className="font-general-sans  text-lg font-medium dark:text-black-100 text-[#D9D9D9]">
      <Link href={link}>
        <h3>{Heading}</h3>
      </Link>
    </div>
  );
}
