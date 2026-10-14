import type { ProfileRole } from "@/lib/api/family";

/** "@everlastinghills" links to the church's own site when no link was given. */
function linkFor(role: ProfileRole): { href: string; external: boolean } | null {
  if (role.url) return { href: role.url, external: true };
  if (role.org && /^everlasting\s*hills/i.test(role.org.replace(/[^a-z\s]/gi, ""))) return { href: "/", external: false };
  return null;
}

/**
 * What a member does, LinkedIn-style: "CEO @sparkpayhq · Lead Pastor
 * @everlastinghills". The @handle links to the place when there is a link.
 */
export default function RolesLine({ roles, className = "" }: { roles: ProfileRole[] | undefined; className?: string }) {
  if (!roles?.length) return null;
  return (
    <ul className={`flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[15px] ${className}`} aria-label="What they do">
      {roles.map((role, i) => {
        const link = linkFor(role);
        const handle = role.org ? `@${role.org.replace(/\s+/g, "").toLowerCase()}` : null;
        return (
          <li key={`${role.title}-${i}`} className="inline-flex items-center gap-1.5">
            {i > 0 && (
              <span aria-hidden="true" className="text-[#b8a8ac] dark:text-white/30">
                ·
              </span>
            )}
            <span className="font-semibold text-[#111] dark:text-white">{role.title}</span>
            {handle &&
              (link ? (
                <a
                  href={link.href}
                  {...(link.external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}
                  className="font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]"
                  title={role.org ?? undefined}
                >
                  {handle}
                </a>
              ) : (
                <span className="font-semibold text-[#87102C] dark:text-[#FFB3C1]" title={role.org ?? undefined}>
                  {handle}
                </span>
              ))}
          </li>
        );
      })}
    </ul>
  );
}
