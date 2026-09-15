import Navbar from "@/components/home/Navbar";
import PageFooter from "@/components/home/PageFooter";
import { getAllSiteSettings } from "@/lib/site-settings";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getAllSiteSettings();
  return (
    <div>
      <Navbar />
      {children}
      <PageFooter directionsContent={settings.DIRECTIONS} givingContent={settings.GIVING} />
    </div>
  );
}
