import Navbar from "@/components/home/Navbar";
import PageFooter from "@/components/home/PageFooter";

/**
 * Public-site layout shell.
 *
 * Every public page gets the navbar at top and the unified PageFooter slab at the
 * bottom (Directions → Giving → Footer). Individual pages render their own content
 * sections in between.
 *
 * The sermon player (SermonPlayerProvider) is mounted once at the app root, not here —
 * scoping it to this layout would unmount it (and kill playback) the moment a visitor
 * navigates to a route outside this group, e.g. /dashboard.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Navbar />
      {children}
      <PageFooter />
    </div>
  );
}
