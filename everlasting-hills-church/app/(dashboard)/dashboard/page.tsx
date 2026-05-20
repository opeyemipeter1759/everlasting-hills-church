import { getUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getUser();

  return (
    <main className="min-h-screen bg-church-dark text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-white/50 text-sm">Signed in as {user?.email}</p>
      </div>
    </main>
  );
}
