"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface MatchProps {
  match: {
    _id: string;
    teamA: string;
    teamB: string;
    startTime: string; // ISO string
    status: string;
    isLocked: boolean;
    // Mocked props
    matchNumber?: string;
    group?: string;
    venue?: string;
  };
}

export default function MatchCard({ match }: MatchProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  
  // Parse start time once
  const startTime = new Date(match.startTime);
  const isUpcoming = match.status === "UPCOMING";
  const isLive = match.status === "LIVE";
  
  // Calculate if match starts in < 30 mins
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
        <Link href={`/site/matches/${match._id}`} className="block w-full text-center py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded animate-pulse transition">
          Closing Soon!
        </Link>
      );
    }

    if (isUpcoming) {
       return (
        <Link href={`/site/matches/${match._id}`} className="block w-full text-center py-3 bg-neon-green hover:bg-green-600 text-black font-bold rounded transition">
          Predict Now
        </Link>
      );
    }
    
    // Default fallback
    return (
        <Link href={`/site/matches/${match._id}`} className="block w-full text-center py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition">
          View Match
        </Link>
    );
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl relative overflow-hidden group hover:border-blue-500 transition-all duration-300">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-blue-500/20 transition"></div>

      {/* Header: Match Info */}
      <div className="flex justify-between items-start mb-6 z-10 relative">
        <div className="text-sm text-gray-400">
          <p className="font-semibold">{match.matchNumber || "Match 12"} • {match.group || "Group B"}</p>
          <p className="text-xs text-gray-500 mt-1">{match.venue || "MCG, Melbourne"}</p>
        </div>
        
        {/* Live/Status Badge */}
        {isLive ? (
           <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse">
             LIVE
           </span>
        ) : (
           <span className="px-3 py-1 bg-blue-900/50 text-blue-300 text-xs font-bold rounded-full border border-blue-800">
             {new Date(match.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
           </span>
        )}
      </div>

      {/* Teams Section */}
      <div className="flex justify-between items-center mb-8 z-10 relative">
        {/* Team A */}
        <div className="text-center flex-1">
          <div className="w-16 h-16 mx-auto bg-gray-700 rounded-full flex items-center justify-center mb-2 shadow-lg ring-2 ring-gray-800">
             <span className="text-2xl">{match.teamA[0]}</span> {/* Fallback Flag */}
          </div>
          <h3 className="font-bold text-lg text-white">{match.teamA}</h3>
        </div>

        <div className="px-4 text-center">
            <span className="text-gray-500 font-bold text-xl">VS</span>
        </div>

        {/* Team B */}
        <div className="text-center flex-1">
          <div className="w-16 h-16 mx-auto bg-gray-700 rounded-full flex items-center justify-center mb-2 shadow-lg ring-2 ring-gray-800">
             <span className="text-2xl">{match.teamB[0]}</span> {/* Fallback Flag */}
          </div>
          <h3 className="font-bold text-lg text-white">{match.teamB}</h3>
        </div>
      </div>

      {/* Countdown / Action Area */}
      <div className="mt-4">
        {timeLeft && isUpcoming && !match.isLocked ? (
          <div className="text-center mb-4">
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Predictions Close In</p>
            <div className="text-2xl font-mono text-neon-blue font-bold tracking-wider">
              {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </div>
          </div>
        ) : null}

        {renderButton()}
      </div>
    </div>
  );
}
