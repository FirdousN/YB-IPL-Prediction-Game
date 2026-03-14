import { getSession } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await getSession() as { role?: string } | null;
  if (!session || session.role !== 'ADMIN') {
    redirect("/admin/login");
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/admin/matches" className="block transform transition hover:scale-105">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 dark:bg-zinc-800 dark:border-zinc-700 cursor-pointer h-full">
            <h2 className="text-xl font-bold mb-2 text-blue-600 dark:text-blue-400">Manage Matches</h2>
            <p className="text-gray-600 dark:text-gray-300">Create, update, and manage match schedules and status.</p>
          </div>
        </Link>

        {/* Pending Implementation of Results Page */}
        <Link href="/admin/results" className="block transform transition hover:scale-105">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 dark:bg-zinc-800 dark:border-zinc-700 cursor-pointer h-full">
            <h2 className="text-xl font-bold mb-2 text-green-600 dark:text-green-400">Declare Results</h2>
            <p className="text-gray-600 dark:text-gray-300">Select match winners and manage prize distribution.</p>
          </div>
        </Link>

        <Link href="/admin/users" className="block transform transition hover:scale-105">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 dark:bg-zinc-800 dark:border-zinc-700 cursor-pointer h-full">
            <h2 className="text-xl font-bold mb-2 text-purple-600 dark:text-purple-400">User Management</h2>
            <p className="text-gray-600 dark:text-gray-300">View registered users and manage their roles.</p>
          </div>
        </Link>

        <Link href="/admin/winners" className="block transform transition hover:scale-105">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 dark:bg-zinc-800 dark:border-zinc-700 cursor-pointer h-full">
            <h2 className="text-xl font-bold mb-2 text-amber-500 dark:text-amber-400">Winners List</h2>
            <p className="text-gray-600 dark:text-gray-300">View past winners and their prizes.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
