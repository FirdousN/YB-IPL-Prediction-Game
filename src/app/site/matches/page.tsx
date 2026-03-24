"use client";

import { useEffect, useState } from "react";
import MatchCard from "@/src/components/MatchCard";

interface Team {
  _id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
}

interface Match {
  _id: string;
  teamA: Team;
  teamB: Team;
  startTime: string;
  status: string;
  isLocked: boolean;
  group?: string;
  venue?: string;
}

interface Prediction {
  _id: string;
  matchId: Match;
  answers: any[];
}

export default function MatchesPage() {
  const [activeTab, setActiveTab] = useState<"UPCOMING" | "LIVE" | "COMPLETED" | "MY_PICKS">("UPCOMING");
  const [matches, setMatches] = useState<Match[]>([]);
  const [myPicks, setMyPicks] = useState<Prediction[]>([]);
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Fetch Matches
        const resMatches = await fetch("/api/matches");
        if (!resMatches.ok) throw new Error("Failed to fetch matches");
        const dataMatches = await resMatches.json();
        const sorted = dataMatches.sort((a: Match, b: Match) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        setMatches(sorted);

        // Fetch My Picks
        try {
          const resPicks = await fetch("/api/predictions");
          if (resPicks.ok) {
            const dataPicks = await resPicks.json();
            setMyPicks(dataPicks);
          }
        } catch (e) {}

        // Fetch Live Scores
        try {
          const resLive = await fetch("/api/live-matches");
          if (resLive.ok) {
            const dataLive = await resLive.json();
            if (dataLive.data) setLiveMatches(dataLive.data);
          }
        } catch (e) {}

      } catch (err: unknown) {
        setError((err instanceof Error ? err.message : String(err)));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getFilteredMatches = () => {
    if (activeTab === "UPCOMING") {
      return matches.filter(m => m.status === "UPCOMING" || new Date(m.startTime) > new Date());
    }
    if (activeTab === "COMPLETED") {
      return matches.filter(m => m.status === "COMPLETED" || new Date(m.startTime) < new Date(Date.now() - 6 * 60 * 60 * 1000));
    }
    if (activeTab === "MY_PICKS") {
      return myPicks.map(p => ({ ...p.matchId }));
    }
    return [];
  };

  const displayMatches = getFilteredMatches();

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return <div className="text-center text-red-500 p-8">Error: {error}</div>;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex justify-center space-x-1 bg-gray-800/50 p-1 rounded-xl max-w-lg mx-auto backdrop-blur-sm border border-white/5 overflow-x-auto">
        {(["UPCOMING", "LIVE", "COMPLETED", "MY_PICKS"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all duration-200 uppercase tracking-widest min-w-max
              ${activeTab === tab
                ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30"
                : "text-gray-400 hover:text-white hover:bg-white/5"}
            `}
          >
            {tab.replace("_", " ")}
            {tab === "LIVE" && <span className="ml-2 w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse"></span>}
          </button>
        ))}
      </div>

      {/* Match Grid */}
      {activeTab === "LIVE" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {liveMatches.length === 0 ? (
             <div className="md:col-span-2 lg:col-span-3 text-center py-12 bg-gray-800/30 rounded-2xl border border-dashed border-gray-700">
               <p className="text-gray-400 text-lg">No live scoring data available at the moment.</p>
             </div>
          ) : (
            liveMatches.map((liveMatch, index) => (
              <div key={liveMatch.id || index} className="p-6 bg-gradient-to-b from-[#1a233a] to-[#0a1122] border border-blue-800/40 rounded-2xl shadow-xl hover:border-blue-500/50 transition-all group overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
                <div className="flex justify-between items-center mb-6">
                   <div className="flex items-center space-x-2">
                     <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                     <span className="text-xs font-black tracking-widest text-red-500">LIVE RESULT</span>
                   </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-white">{liveMatch.t1 || "Team 1"}</span>
                    <span className="text-lg font-bold text-gray-300">{liveMatch.t1s || "-"}</span>
                  </div>
                  <div className="w-full h-px bg-gray-700/50"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-white">{liveMatch.t2 || "Team 2"}</span>
                    <span className="text-lg font-bold text-gray-300">{liveMatch.t2s || "-"}</span>
                  </div>
                </div>
                
                <div className="mt-8 p-3 rounded-xl bg-blue-900/20 border border-blue-800/30">
                  <p className="text-center text-sm font-semibold text-blue-300">
                    {liveMatch.status || "Match Details Loading..."}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <>
          {displayMatches.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/30 rounded-2xl border border-dashed border-gray-700">
              <p className="text-gray-400 text-lg">
                {activeTab === "MY_PICKS"
                  ? "You haven't made any predictions yet."
                  : "No matches scheduled for this day."}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {displayMatches.map((match) => (
                <MatchCard key={match._id} match={match} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
