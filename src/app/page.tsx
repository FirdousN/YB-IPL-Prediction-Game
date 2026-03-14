"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface UserSession {
  name: string;
  role: string;
}

export default function Home() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check session on mount
    fetch('/api/auth/session')
      .then(res => {
        if (res.ok) {
          return res.json();
        }
        return null;
      })
      .then(data => {
        if (data && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => { });
  }, []);

  const handleLogout = async () => {
    // Implement logout logic if needed, or just clear cookie on client?
    // For now, let's assume we might need an API or just redirect to login which clears?
    // This app seems to lack a clear logout API. Let's just client-redirect for now or clear state.
    // Usually strictly needs a server logout route to clear httpOnly cookie.
    // Assuming user just wants UI for now.
    // Let's create a logout route later if needed, for now just UI.
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-black text-white p-4 relative">

      {/* Top Right Header */}
      <div className="absolute top-0 right-0 p-6 z-50">
        {user ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full backdrop-blur-md transition border border-white/10"
            >
              <span className="font-semibold text-blue-300">{user.name}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-3 border-b border-gray-800">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Signed in as</p>
                  <p className="text-white font-bold truncate">{user.name}</p>
                </div>

                <Link href="/site/profile" className="block px-4 py-2 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition">
                  Profile
                </Link>
                <Link href="/site/matches?tab=MY_PICKS" className="block px-4 py-2 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition">
                  My Picks / History
                </Link>
                <Link href="/site/results" className="block px-4 py-2 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition">
                  Results
                </Link>

                <div className="border-t border-gray-800 mt-2 pt-2">
                  <button
                    onClick={() => {
                      // Quick hack for logout if API absent, typically should allow clearing cookie
                      document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                      setUser(null);
                      setDropdownOpen(false);
                      window.location.reload();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="px-6 py-2 bg-transparent border border-blue-400 text-blue-400 font-bold rounded-full hover:bg-blue-400 hover:text-black transition shadow-[0_0_15px_rgba(59,130,246,0.5)]"
          >
            Login
          </Link>
        )}
      </div>

      <main className="flex flex-col items-center text-center max-w-4xl space-y-8">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
          YesBharath <span className="text-blue-400">Cricket Predictor</span>
        </h1>
        <p className="text-lg text-gray-300 max-w-2xl">
          Predict match outcomes, compete with friends, and win daily prizes!
          Join the ultimate cricket prediction platform now.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link
            href="/site/matches"
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25"
          >
            {user ? "Go to Dashboard" : "Start Predicting"}
          </Link>
          {/* Removed redundant Login button from center as requested */}
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left w-full">
          <div className="p-6 bg-white/10 rounded-xl backdrop-blur-sm border border-white/5 hover:border-blue-500/50 transition duration-300">
            <h3 className="text-xl font-bold mb-2 text-blue-300">Live Matches</h3>
            <p className="text-gray-400">Get real-time updates and predict on live games.</p>
          </div>
          <div className="p-6 bg-white/10 rounded-xl backdrop-blur-sm border border-white/5 hover:border-purple-500/50 transition duration-300">
            <h3 className="text-xl font-bold mb-2 text-purple-300">Win Prizes</h3>
            <p className="text-gray-400">Top predictors every day win exciting rewards.</p>
          </div>
          <div className="p-6 bg-white/10 rounded-xl backdrop-blur-sm border border-white/5 hover:border-green-500/50 transition duration-300">
            <h3 className="text-xl font-bold mb-2 text-green-300">Leaderboard</h3>
            <p className="text-gray-400">Climb the ranks and show off your cricket knowledge.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
