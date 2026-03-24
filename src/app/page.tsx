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
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
  const [loadingFixtures, setLoadingFixtures] = useState(true);

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
        if (data && data.user) setUser(data.user);
      })
      .catch(() => { });

    // Load upcoming IPL Fixtures from CricAPI
    fetch('/api/site/ipl')
      .then(res => res.json())
      .then(data => {
        if (data.matches) {
          // Filter out finished matches to only show upcoming ones on the landing page
          const upcoming = data.matches.filter((m: any) => m.matchEnded === false || new Date(m.date) > new Date());
          setUpcomingMatches(upcoming.slice(0, 3));
        }
      })
      .catch(console.error)
      .finally(() => setLoadingFixtures(false));
  }, []);


  return (
    <>
      {/* Navigation */}
      <Nav />
      {/* Background and Overlay Wrapper */}
      <div
        className="flex min-h-screen flex-col items-center justify-center text-white py-12 px-4 relative bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url('/stadium-bg.avif')" }}
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

          {/* Upcoming Matches Preview */}
          <div className="w-full mt-12 bg-black/60 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-white uppercase tracking-widest border-l-4 border-blue-500 pl-4">
                Upcoming IPL Fixtures
              </h2>
              <Link href="/site/matches" className="text-blue-400 font-bold hover:text-white transition">
                Match Centre →
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              {upcomingMatches.length === 0 && (
                <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 text-gray-400 font-medium border border-dashed border-gray-700 rounded-xl">
                  {loadingFixtures ? (
                    <div className="flex justify-center items-center space-x-3">
                      <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin"></div>
                      <span>Loading Official Tata IPL Data...</span>
                    </div>
                  ) : "No upcoming matches found or tournament hasn't started."}
                </div>
              )}
              {upcomingMatches.map((m: any) => (
                <div key={m.id} className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 transition duration-300">
                  <div className="flex justify-between items-center mb-4 text-xs font-black text-gray-400 tracking-wider">
                    <span>{new Date(m.date).toLocaleDateString()}</span>
                    <span className="text-blue-400">{m.venue?.split(",")[0] || "TBD"}</span>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    {m.teamInfo?.map((team: any) => (
                      <div key={team.shortname} className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <img src={team.img} alt={team.shortname} className="w-8 h-8 object-contain rounded-full shadow-sm bg-white border border-gray-200" />
                          <span className="font-bold text-white tracking-wide">{team.shortname}</span>
                        </div>
                        <span className="font-bold text-gray-500">-</span>
                      </div>
                    ))}
                  </div>

                  <Link href="/site/matches" className="block w-full py-3 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white text-center font-bold rounded-xl transition text-sm">
                    Predict Now
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
