"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Nav from "../components/layout/Nav/Nav";

interface UserSession {
  name: string;
  role: string;
}

export default function Home() {
  const [user, setUser] = useState<UserSession | null>(null);

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


  return (
    <>
      {/* Navigation */}
      <Nav />
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-black text-white py-12 px-4 relative">
        {/* Top Right Header */}
        <main className="flex flex-col items-center text-center max-w-4xl space-y-8">
          {/* Main Header */}
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
            YesBharath <span className="text-blue-400">Cricket Predictor</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl">
            Predict match outcomes, compete with friends, and win daily prizes!
            Join the ultimate cricket prediction platform now.
          </p>

          {/* Prediction Start button */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link
              href="/site/matches"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25"
            >
              {user ? "Go to Dashboard" : "Start Predicting"}
            </Link>
            {/* Removed redundant Login button from center as requested */}
          </div>

          {/* List of matches */}
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
    </>
  );
}
