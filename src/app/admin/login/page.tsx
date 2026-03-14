"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push("/admin");
      } else {
        const data = await res.json();
        setError(data.error || "Login failed");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-400">Dev Admin Access</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-400">Username</label>
            <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="Enter dev user"
                required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-400">Password</label>
            <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="Enter dev password"
                required
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Login to Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}
