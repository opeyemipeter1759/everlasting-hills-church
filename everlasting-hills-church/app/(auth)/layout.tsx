export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-church-dark flex items-center justify-center px-5">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
