"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Team {
  _id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
}

interface MatchProps {
  match: {
    _id: string;
    teamA: Team;
    teamB: Team;
    startTime: string; // ISO string
    status: string;
    isLocked: boolean;
    questions?: any[]; 
    matchNumber?: string;
    group?: string;
    venue?: string;
  };
}

export default function MatchCard({ match }: MatchProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  
  const isUpcoming = match.status === "UPCOMING";
  const isLive = match.status === "LIVE";
  const [startsSoon, setStartsSoon] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const startTime = new Date(match.startTime);
      const diff = startTime.getTime() - now.getTime();

      if (diff > 0) {
        const hours = Math.floor((diff / (1000 * 60 * 60)));
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft({ hours, minutes, seconds });
        
        // Check if less than 30 mins
        setStartsSoon(diff < 30 * 60 * 1000);
      } else {
        setTimeLeft(null);
        setStartsSoon(false);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [match.startTime]);

  const isMatchToday = (isoString: string) => {
    const today = new Date();
    const matchDate = new Date(isoString);
    return today.getFullYear() === matchDate.getFullYear() && 
           today.getMonth() === matchDate.getMonth() && 
           today.getDate() === matchDate.getDate();
  };

  // Determine Button State
  const renderButton = () => {
    if (match.isLocked || match.status === "COMPLETED") {
      return (
        <button disabled className="w-full py-3 bg-gray-700 text-gray-400 font-bold rounded cursor-not-allowed">
          {match.status === "COMPLETED" ? "Match Ended" : "Predictions Locked"}
        </button>
      );
    }

    if (startsSoon) {
      return (
        <Link href={`/site/matches/${match._id}`} className="block w-full text-center py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded animate-pulse transition shadow-lg">
          Closing Soon!
        </Link>
      );
    }

    if (isUpcoming) {
       if (isMatchToday(match.startTime)) {
         return (
          <Link href={`/site/matches/${match._id}`} className="block w-full text-center py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded transition shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            Predict Now
          </Link>
         );
       } else {
         return (
          <Link href={`/site/matches/${match._id}`} className="block w-full text-center py-3 border border-gray-600 hover:bg-gray-800 text-gray-300 font-bold rounded transition">
            Opens on Match Day
          </Link>
         );
       }
    }
    
    // Default fallback
    return (
        <Link href={`/site/matches/${match._id}`} className="block w-full text-center py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded transition">
          View Match
        </Link>
    );
  };

  const TeamLogo = ({ team }: { team?: Team }) => {
    if (!team) return <div className="w-16 h-16 mx-auto bg-gray-700 rounded-full mb-2 border border-gray-600"></div>;
    return team.logoUrl ? (
      <img src={team.logoUrl} alt={team.shortName} className="w-16 h-16 mx-auto bg-white rounded-full mb-2 shadow-lg ring-2 ring-blue-500/30 object-contain p-1" />
    ) : (
      <div className="w-16 h-16 mx-auto bg-gray-700 rounded-full flex items-center justify-center mb-2 shadow-lg ring-2 ring-gray-600">
         <span className="text-xl font-black text-gray-300">{team.shortName}</span>
      </div>
    );
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-blue-500 hover:shadow-blue-900/20 transition-all duration-300 border-t-2 border-t-blue-500/30">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-blue-500/20 transition"></div>

      {/* Header: Match Info */}
      <div className="flex justify-between items-start mb-6 z-10 relative">
        <div className="text-sm text-gray-400">
          <p className="font-semibold">{match.matchNumber || "League Match"} • {match.group || "T20"}</p>
          <p className="text-xs text-gray-500 mt-1">{match.venue || "Stadium"}</p>
        </div>
        
        {/* Live/Status Badge */}
        {isLive ? (
           <span className="px-3 py-1 bg-red-600/20 text-red-500 border border-red-500/50 text-xs font-black rounded-full animate-pulse tracking-widest">
             LIVE
           </span>
        ) : (
           <span className="px-3 py-1 bg-blue-900/30 text-blue-400 text-xs font-bold rounded-full border border-blue-800/50 tracking-wider">
             {new Date(match.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
           </span>
        )}
      </div>

      {/* Teams Section */}
      <div className="flex justify-between items-center mb-8 z-10 relative mt-4">
        {/* Team A */}
        <div className="text-center flex-1">
          <TeamLogo team={match.teamA} />
          <h3 className="font-black text-lg text-white leading-tight mt-2">{match.teamA?.shortName || "TBD"}</h3>
        </div>

        <div className="px-4 text-center">
            <span className="text-gray-600 font-black text-xl italic tracking-tighter mix-blend-screen opacity-50">VS</span>
        </div>

        {/* Team B */}
        <div className="text-center flex-1">
          <TeamLogo team={match.teamB} />
          <h3 className="font-black text-lg text-white leading-tight mt-2">{match.teamB?.shortName || "TBD"}</h3>
        </div>
      </div>

      {/* Countdown / Action Area */}
      <div className="mt-6">
        {timeLeft && isUpcoming && !match.isLocked ? (
          <div className="text-center mb-5 bg-black/30 p-3 rounded-lg border border-white/5">
            <p className="text-blue-400/80 text-[10px] uppercase font-bold tracking-widest mb-1">Locks in</p>
            <div className="text-2xl font-mono text-white font-black tracking-wider">
              {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </div>
          </div>
        ) : null}

        {renderButton()}
      </div>
    </div>
  );
}
