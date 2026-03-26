"use client";

import MatchGrid from "./MatchGrid";

interface LiveSectionProps {
  matches: any[];
  liveMatches: any[]; // Network live updates
}

export default function LiveSection({ matches, liveMatches }: LiveSectionProps) {
  return (
    <div className="space-y-10">
      {/* Network Live Updates (API) */}
      {liveMatches.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {liveMatches.map((liveMatch, index) => (
            <div key={liveMatch.id || index} className="p-6 bg-gradient-to-b from-surface to-surface-hover border border-border rounded-3xl shadow-xl hover:border-accent/30 transition-all group overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                  <span className="text-[10px] font-black tracking-widest text-red-500">NETWORK LIVE UPDATE</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-black text-text-primary uppercase tracking-tighter">{liveMatch.t1 || "Team 1"}</span>
                  <span className="text-lg font-black text-accent">{liveMatch.t1s || "-"}</span>
                </div>
                <div className="w-full h-px bg-border/50"></div>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-black text-text-primary uppercase tracking-tighter">{liveMatch.t2 || "Team 2"}</span>
                  <span className="text-lg font-black text-accent">{liveMatch.t2s || "-"}</span>
                </div>
              </div>
              <div className="mt-8 p-3 rounded-2xl bg-accent/5 border border-accent/10">
                <p className="text-center text-[10px] font-black text-accent uppercase tracking-widest">
                  {liveMatch.status || "Match Details Loading..."}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Internal Live Matches */}
      <MatchGrid 
        matches={matches} 
        emptyMessage={liveMatches.length === 0 ? "No active matches in clinical live state." : ""}
      />
    </div>
  );
}
