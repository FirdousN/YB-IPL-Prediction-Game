"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Nav from "../components/layout/Nav/Nav";
import { X, ChevronRight } from "lucide-react";

interface UserSession {
  name: string;
  role: string;
}

export default function Home() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
  const [loadingFixtures, setLoadingFixtures] = useState(true);
  const [showLive, setShowLive] = useState(false);
  const [showPrizes, setShowPrizes] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    // Check session on mount
    fetch('/api/auth/session')
      .then(res => res.ok ? res.json() : null)
      .then(data => data?.user && setUser(data.user))
      .catch(() => { });

    // Load upcoming IPL Fixtures
    fetch('/api/site/ipl')
      .then(res => res.json())
      .then(data => {
        if (data.matches) {
          const upcoming = data.matches.filter((m: any) => m.matchEnded === false || new Date(m.date) > new Date());
          setUpcomingMatches(upcoming.slice(0, 3));
        }
      })
      .catch(console.error)
      .finally(() => setLoadingFixtures(false));

    // Load Real Leaderboard
    fetch('/api/site/leaderboard')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setLeaderboard(data.slice(0, 5)); })
      .catch(console.error);
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
          <div className="flex flex-col sm:flex-row gap-6 mt-12">
            <Link
              href="/site/matches"
              className="group relative px-10 py-5 bg-blue-600 rounded-2xl text-2xl font-black transition-all duration-500 hover:scale-105 shadow-[0_0_50px_rgba(37,99,235,0.4)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="relative z-10 tracking-[0.1em] uppercase">Start Prediction</span>
            </Link>
          </div>

          {/* 3 Main Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 w-full max-w-5xl px-4">
            {/* Live Matches Card */}
            <button 
              onClick={() => { setShowLive(!showLive); setShowPrizes(false); setShowLeaderboard(false); }}
              className={`group relative bg-white/5 backdrop-blur-xl border rounded-[2.5rem] p-8 transition-all duration-500 text-left flex flex-col justify-between h-48 overflow-hidden ${showLive ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_40px_rgba(59,130,246,0.2)]' : 'border-white/10 hover:border-blue-500/50 hover:bg-white/10'}`}
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                 <div className="w-12 h-12 bg-blue-500 rounded-full blur-2xl"></div>
              </div>
              <div className="relative z-10">
                <h3 className={`text-2xl font-black mb-2 tracking-tight transition-colors ${showLive ? 'text-blue-400' : 'text-white group-hover:text-blue-400'}`}>Live Matches</h3>
                <p className="text-gray-400 text-sm font-medium leading-relaxed">
                  Real-time IPL 2026 updates and active prediction opportunities.
                </p>
              </div>
              <div className="relative z-10 mt-4">
                 <span className={`text-[10px] font-black tracking-[0.3em] uppercase transition-colors ${showLive ? 'text-blue-400' : 'text-blue-500/50 group-hover:text-blue-400'}`}>
                    {showLive ? 'Close View —' : 'View Details —'}
                 </span>
              </div>
            </button>

            {/* Win Prizes Card */}
            <button 
              onClick={() => { setShowPrizes(!showPrizes); setShowLive(false); setShowLeaderboard(false); }}
              className={`group relative bg-white/5 backdrop-blur-xl border rounded-[2.5rem] p-8 transition-all duration-500 text-left flex flex-col justify-between h-48 overflow-hidden ${showPrizes ? 'border-pink-500 bg-pink-500/10 shadow-[0_0_40px_rgba(236,72,153,0.2)]' : 'border-white/10 hover:border-pink-500/50 hover:bg-white/10'}`}
            >
              <div className="relative z-10">
                <h3 className={`text-2xl font-black mb-2 tracking-tight transition-colors ${showPrizes ? 'text-pink-400' : 'text-white group-hover:text-pink-400'}`}>Win Prizes</h3>
                <p className="text-gray-400 text-sm font-medium leading-relaxed">
                  Daily rewards for the top predictors in the global leaderboard.
                </p>
              </div>
              <div className="relative z-10 mt-4">
                 <span className={`text-[10px] font-black tracking-[0.3em] uppercase transition-colors ${showPrizes ? 'text-pink-400' : 'text-pink-500/50 group-hover:text-pink-400'}`}>
                    {showPrizes ? 'Close View —' : 'View Details —'}
                 </span>
              </div>
            </button>

            {/* Leaderboard Card */}
            <button 
              onClick={() => { setShowLeaderboard(!showLeaderboard); setShowLive(false); setShowPrizes(false); }}
              className={`group relative bg-white/5 backdrop-blur-xl border rounded-[2.5rem] p-8 transition-all duration-500 text-left flex flex-col justify-between h-48 overflow-hidden ${showLeaderboard ? 'border-green-500 bg-green-500/10 shadow-[0_0_40px_rgba(34,197,94,0.2)]' : 'border-white/10 hover:border-green-500/50 hover:bg-white/10'}`}
            >
              <div className="relative z-10">
                <h3 className={`text-2xl font-black mb-2 tracking-tight transition-colors ${showLeaderboard ? 'text-green-400' : 'text-white group-hover:text-green-400'}`}>Leaderboard</h3>
                <p className="text-gray-400 text-sm font-medium leading-relaxed">
                  Climb the ranks and compete against thousands of cricket fans.
                </p>
              </div>
              <div className="relative z-10 mt-4">
                 <span className={`text-[10px] font-black tracking-[0.3em] uppercase transition-colors ${showLeaderboard ? 'text-green-400' : 'text-green-500/50 group-hover:text-green-400'}`}>
                    {showLeaderboard ? 'Close View —' : 'View Details —'}
                 </span>
              </div>
            </button>
          </div>

          {/* Upcoming Matches Preview - Smooth Transformation */}
          <div 
            className={`w-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) overflow-hidden transform fixed inset-x-0 bottom-0 z-50 px-4 pb-4 ${
              showLive 
                ? "translate-y-0 opacity-100 pointer-events-auto" 
                : "translate-y-full opacity-0 pointer-events-none"
            }`}
          >
            <div className="bg-gray-950/90 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-8 shadow-[0_-20px_100px_rgba(0,0,0,0.8)] max-w-5xl mx-auto max-h-[85vh] overflow-y-auto">
              {/* Header */}
              <div className="flex justify-between items-center mb-10 sticky top-0 bg-transparent z-10 py-2">
                <div>
                   <h2 className="text-3xl font-black text-white uppercase tracking-[0.2em] italic border-l-4 border-blue-600 pl-6">
                     Match Centre
                   </h2>
                   <p className="text-[10px] font-bold text-gray-500 tracking-[0.4em] uppercase mt-2 pl-6">IPL 2026 Official Fixtures</p>
                </div>
                <button 
                  onClick={() => setShowLive(false)}
                  className="bg-white/5 hover:bg-white/10 p-4 rounded-full border border-white/10 transition-all text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {upcomingMatches.length === 0 && !loadingFixtures ? (
                  <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-20 bg-black/40 rounded-[2.5rem] border border-white/5">
                     <p className="text-gray-600 font-black text-xl tracking-widest uppercase italic">Schedule Not Finalized</p>
                  </div>
                ) : loadingFixtures ? (
                  <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-20">
                     <div className="w-12 h-12 border-4 border-t-transparent border-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                     <span className="text-[10px] font-black text-blue-500 tracking-[0.5em] uppercase animate-pulse">Syncing...</span>
                  </div>
                ) : (
                  upcomingMatches.map((m: any) => (
                    <div key={m.id} className="relative group/match">
                      <div className="absolute inset-0 bg-blue-600/10 blur-2xl opacity-0 group-hover/match:opacity-100 transition-opacity duration-700"></div>
                      <div className="relative bg-gradient-to-br from-gray-900 to-black border border-white/5 rounded-[2.5rem] p-8 hover:border-blue-500/30 transition-all duration-500">
                        <div className="flex justify-between items-center mb-8">
                           <div className="flex flex-col">
                             <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">{new Date(m.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                             <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{m.venue?.split(",")[0] || "TBD"}</span>
                           </div>
                           <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                        </div>
                        
                        <div className="space-y-6 mb-8">
                          {m.teamInfo?.map((team: any) => (
                            <div key={team.shortname} className="flex justify-between items-center group/team">
                              <div className="flex items-center space-x-4">
                                <img src={team.img} alt={team.shortname} className="w-10 h-10 object-contain rounded-full shadow-2xl bg-white border border-gray-800 p-1.5 transition-transform group-hover/team:scale-110" />
                                <span className="font-extrabold text-white tracking-widest text-lg group-hover/team:text-blue-400 transition-colors">{team.shortname}</span>
                              </div>
                              <span className="text-gray-800 font-bold">—</span>
                            </div>
                          ))}
                        </div>

                        <Link href="/site/matches" className="group/btn relative block w-full py-4 bg-white/5 hover:bg-blue-600 rounded-2xl text-center transition-all duration-500 overflow-hidden">
                          <span className="relative z-10 text-xs font-black text-gray-400 group-hover/btn:text-white uppercase tracking-[0.2em]">Predict Now</span>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-12 text-center text-[10px] font-bold text-gray-700 uppercase tracking-[0.4em]">Official 2026 Match Schedule</div>
            </div>
          </div>

          {/* Win Prizes - Bottom Component */}
          <div 
            className={`w-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) overflow-hidden transform fixed inset-x-0 bottom-0 z-50 px-4 pb-4 ${
              showPrizes ? "translate-y-0 opacity-100 pointer-events-auto" : "translate-y-full opacity-0 pointer-events-none"
            }`}
          >
            <div className="bg-gray-950/90 backdrop-blur-2xl border border-pink-500/20 rounded-[3rem] p-8 shadow-[0_-20px_100px_rgba(0,0,0,0.8)] max-w-5xl mx-auto max-h-[85vh] overflow-y-auto">
               <div className="flex justify-between items-center mb-10">
                  <h2 className="text-3xl font-black text-white uppercase tracking-[0.2em] italic border-l-4 border-pink-600 pl-6">Season Rewards</h2>
                  <button onClick={() => setShowPrizes(false)} className="bg-white/5 hover:bg-white/10 p-4 rounded-full border border-white/10 transition-all text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
               </div>
               
               <div className="text-center py-10 mb-8 bg-pink-600/5 rounded-[2.5rem] border border-pink-500/10">
                  <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-widest italic">Jackpots Unlock March 28th</h3>
                  <p className="text-pink-400 text-xs font-bold uppercase tracking-[0.4em]">Official Tata IPL 2026 Prediction Rewards</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { title: "Daily Mega Prize", desc: "Climb the daily charts to win cash rewards and official match tickets." },
                    { title: "Weekly Pro Kit", desc: "Highest accuracy predictors win premium cricket gear and merchandise." },
                    { title: "Season Grand Prize", desc: "The ultimate predictor wins a luxury tech bundle including a flagship smartphone." }
                  ].map((p, i) => (
                    <div key={i} className="bg-white/5 border border-white/5 rounded-3xl p-8 hover:bg-white/10 transition-all">
                       <h4 className="text-pink-500 font-black uppercase tracking-widest text-xs mb-4">{p.title}</h4>
                       <p className="text-gray-300 text-sm font-medium leading-relaxed">{p.desc}</p>
                    </div>
                  ))}
               </div>
               <p className="mt-10 text-center text-gray-600 font-bold uppercase text-[10px] tracking-[0.3em]">All rewards are subject to YashBharath daily leaderboard standings</p>
            </div>
          </div>

          {/* Leaderboard - Bottom Component */}
          <div 
            className={`w-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) overflow-hidden transform fixed inset-x-0 bottom-0 z-50 px-4 pb-4 ${
              showLeaderboard ? "translate-y-0 opacity-100 pointer-events-auto" : "translate-y-full opacity-0 pointer-events-none"
            }`}
          >
            <div className="bg-gray-950/90 backdrop-blur-2xl border border-green-500/20 rounded-[3rem] p-8 shadow-[0_-20px_100px_rgba(0,0,0,0.8)] max-w-5xl mx-auto max-h-[85vh] overflow-y-auto">
               <div className="flex justify-between items-center mb-10">
                  <h2 className="text-3xl font-black text-white uppercase tracking-[0.2em] italic border-l-4 border-green-600 pl-6">Global Leaderboard</h2>
                  <button onClick={() => setShowLeaderboard(false)} className="bg-white/5 hover:bg-white/10 p-4 rounded-full border border-white/10 transition-all text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
               </div>
               
               {leaderboard.length === 0 ? (
                 <div className="text-center py-20 bg-green-900/5 rounded-3xl border border-green-500/10">
                    <p className="text-green-500/50 font-black text-xl tracking-widest uppercase italic">Ranking Starts March 28th</p>
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.3em] mt-2">Be the first to predict and top the charts!</p>
                 </div>
               ) : (
                 <div className="space-y-4">
                    {leaderboard.map((u, i) => (
                      <div key={i} className="flex items-center justify-between bg-green-900/10 border border-green-500/10 rounded-2xl p-6 hover:bg-green-900/20 transition-all">
                         <div className="flex items-center space-x-6">
                            <span className="text-2xl font-black text-green-500">#{i + 1}</span>
                            <div>
                               <p className="text-white font-black text-lg tracking-wide">{u.name}</p>
                               <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Global Rank</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-xl font-black text-white">{u.points || 0}</p>
                            <p className="text-green-500 text-[10px] font-black uppercase tracking-widest">PTS</p>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
               
               <div className="mt-8 text-center">
                  <Link href="/site/leaderboard" className="inline-block py-4 px-10 bg-green-600/10 hover:bg-green-600 text-green-500 hover:text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl border border-green-500/20 transition-all">
                     View Full Rankings →
                  </Link>
               </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
