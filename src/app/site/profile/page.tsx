export const dynamic = 'force-dynamic';

import { getSession } from "@/src/lib/session";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
    const session = await getSession() as { role?: string; participantId?: string; userId?: string; name?: string } | null;
    if (!session) {
        redirect("/login");
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">My Profile</h1>
            <div className="bg-gray-800 p-6 rounded shadow max-w-md border border-gray-700">
                <p className="mb-2"><strong className="text-blue-400">Name:</strong> {session.name}</p>
                <p className="mb-2"><strong className="text-blue-400">Role:</strong> {session.role}</p>
                <p className="mb-2"><strong className="text-blue-400">UserID:</strong> <span className="text-gray-400 text-sm">{session.userId}</span></p>
                {/* Add more profile details or edit functionality later */}
            </div>
        </div>
    );
}
