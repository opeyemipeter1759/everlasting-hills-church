import PrayerForm from "@/components/Formpage/PrayerForm";

export default function PrayerRequestPage() {
  return (
    <main className="min-h-screen bg-church-dark text-white selection:bg-church-maroon relative overflow-x-hidden py-12 px-4 sm:px-5">
      {/* Cinematic Background with Fade Gradients (from Auth/First Timer) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img 
          src="/images/church_congregation_3_1779193624434.png" 
          alt="Everlasting Hills Community" 
          className="w-full h-full object-cover opacity-40 scale-105"
        />
        {/* The Fade-In/Out Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-church-dark via-church-dark/40 to-church-dark" />
        <div className="absolute inset-0 bg-gradient-to-b from-church-dark/80 via-transparent to-church-dark/80" />
        <div className="absolute inset-0 bg-church-dark/20 backdrop-brightness-[0.8]" />
      </div>
      <div className="w-full max-w-4xl mx-auto relative z-10 flex items-center justify-center min-h-[80vh]">
        <PrayerForm />
      </div>
    </main>
  );
}