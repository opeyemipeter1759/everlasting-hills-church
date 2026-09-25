export default function MobileLiveBar({ href, label }: { href: string; label: string }) {
  return <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#10080b]/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur md:hidden"><a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined} className="flex min-h-12 w-full items-center justify-center rounded-full bg-white text-sm font-black uppercase tracking-[0.08em] text-[#6E0C24]">{label}</a></div>;
}
