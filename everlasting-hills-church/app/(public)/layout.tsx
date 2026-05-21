import Footer from "@/components/home/Footer";
import Navbar from "@/components/home/Navbar";


export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}
