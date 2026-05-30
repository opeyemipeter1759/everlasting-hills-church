import Navbar from "@/components/home/Navbar";
import PageFooter from "@/components/home/PageFooter";

/**
 * Public-site layout shell.
 *
 * Every public page gets the navbar at top and the unified PageFooter slab at the
 * bottom (Directions → Giving → Footer). Individual pages render their own content
 * sections in between.
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
