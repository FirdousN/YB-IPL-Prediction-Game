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
      {/* Background and Overlay Wrapper */}
      <div 
        className="flex min-h-screen flex-col items-center justify-center text-white py-12 px-4 relative bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url('/stadium-bg.png')" }}
      >
        <div className="absolute inset-0 bg-gray-900/60 z-0"></div>

        {/* Top Right Header */}
        <main className="flex flex-col items-center text-center max-w-5xl space-y-8 relative z-10 mt-16">
          {/* Main Header */}
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
            YesBharath <span className="text-blue-400">Cricket Predictor</span>
          </h1>
          <p className="text-lg text-gray-200 max-w-2xl font-medium tracking-wide">
            Predict match outcomes, compete with friends, and win daily prizes!
            Join the ultimate cricket prediction platform now.
          </p>

          {/* Prediction Start button */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link
              href="/site/matches"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(59,130,246,0.5)] border border-blue-400/50"
            >
              {user ? "Go to Dashboard" : "Start Predicting"}
            </Link>
          </div>

          {/* List of matches */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left w-full">
            <Link href="/site/matches" className="p-6 bg-gray-800/40 rounded-2xl backdrop-blur-md border border-white/10 hover:border-blue-500/50 hover:bg-gray-800/60 transition duration-300 cursor-pointer group block shadow-2xl">
              <h3 className="text-xl font-bold mb-2 text-blue-300 group-hover:text-blue-400">Live Matches</h3>
              <p className="text-gray-300">Get real-time updates and predict on live games.</p>
            </Link>
            
            <Link href="/site/rewards" className="p-6 bg-gray-800/40 rounded-2xl backdrop-blur-md border border-white/10 hover:border-purple-500/50 hover:bg-gray-800/60 transition duration-300 cursor-pointer group block shadow-2xl">
              <h3 className="text-xl font-bold mb-2 text-purple-300 group-hover:text-purple-400">Win Prizes</h3>
              <p className="text-gray-300">Top predictors every day win exciting rewards.</p>
            </Link>
            
            <Link href="/site/leaderboard" className="p-6 bg-gray-800/40 rounded-2xl backdrop-blur-md border border-white/10 hover:border-green-500/50 hover:bg-gray-800/60 transition duration-300 cursor-pointer group block shadow-2xl">
              <h3 className="text-xl font-bold mb-2 text-green-300 group-hover:text-green-400">Leaderboard</h3>
              <p className="text-gray-300">Climb the ranks and show off your cricket knowledge.</p>
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
