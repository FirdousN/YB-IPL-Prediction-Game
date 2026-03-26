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
    winner?: any;
    result?: string;
    teamAScore?: { r?: number; w?: number; o?: string };
    teamBScore?: { r?: number; w?: number; o?: string };
  };
  prediction?: {
    answers: any[];
    totalPoints?: number;
    isWinner?: boolean;
    rank?: number;
  };
}

export default function MatchCard({ match, prediction }: MatchProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const isCompleted = match.status?.toUpperCase() === "COMPLETED";
  const isLiveOrUpcoming = match.status?.toUpperCase() === "LIVE" || match.status?.toUpperCase() === "UPCOMING";
  const isUpcoming = match.status?.toUpperCase() === "UPCOMING";
  const isLive = match.status?.toUpperCase() === "LIVE";
  const [startsSoon, setStartsSoon] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const startTime = new Date(match.startTime);
      const diff = startTime.getTime() - now.getTime();
      const oneDay = 24 * 60 * 60 * 1000;

      if (diff > 0) {
        if (diff > oneDay) {
          const days = Math.floor(diff / oneDay);
          const hours = Math.floor((diff % oneDay) / (1000 * 60 * 60));
          setTimeLeft({ days, hours, minutes: 0, seconds: 0 } as any);
        } else {
          const hours = Math.floor((diff / (1000 * 60 * 60)));
          const minutes = Math.floor((diff / (1000 * 60)) % 60);
          const seconds = Math.floor((diff / 1000) % 60);
          setTimeLeft({ hours, minutes, seconds });
        }

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
    if (isCompleted) {
      return (
        <Link href={`/site/matches/${match._id}`} className="block w-full text-center py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl transition-all shadow-xl shadow-emerald-500/20 uppercase tracking-widest text-[11px] active:scale-95">
          View Results
        </Link>
      );
    }

    if (match.isLocked) {
      return (
        <Link href={`/site/matches/${match._id}`} className="block w-full text-center py-4 bg-surface-hover hover:bg-surface border border-border text-text-primary font-black rounded-2xl transition-all uppercase tracking-widest text-[10px]">
          View Your Picks
        </Link>
      );
    }

    if (startsSoon) {
      return (
        <Link href={`/site/matches/${match._id}`} className="block w-full text-center py-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl animate-pulse transition-all shadow-xl shadow-amber-500/20 uppercase tracking-widest text-[11px]">
          Closing Soon!
        </Link>
      );
    }

    if (isUpcoming) {
      if (isMatchToday(match.startTime)) {
        return (
          <Link href={`/site/matches/${match._id}`} className="block w-full text-center py-4 bg-accent hover:bg-accent-hover text-white font-black rounded-2xl transition-all shadow-xl shadow-accent/20 uppercase tracking-widest text-[11px] active:scale-95">
            Predict Now
          </Link>
        );
      } else {
        return (
          <Link href={`/site/matches/${match._id}`} className="block w-full text-center py-4 border border-border hover:bg-surface-hover text-text-secondary font-black rounded-2xl transition-all uppercase tracking-widest text-[10px]">
            Opens on Match Day
          </Link>
        );
      }
    }

    // Default fallback
    return (
      <Link href={`/site/matches/${match._id}`} className="block w-full text-center py-4 bg-surface-hover hover:bg-surface border border-border text-text-primary font-black rounded-2xl transition-all uppercase tracking-widest text-[10px]">
        View Arena
      </Link>
    );
  };

  const TeamLogo = ({ team, isWinner }: { team?: Team; isWinner?: boolean }) => {
    if (!team) return <div className="w-20 h-20 mx-auto bg-surface-hover rounded-[1.5rem] mb-3 border border-border"></div>;
    return team.logoUrl ? (
      <div className="relative group/logo">
        <div className={`absolute inset-0 ${isWinner ? 'bg-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'bg-accent/5'} rounded-full blur-xl scale-75 group-hover/logo:scale-110 transition duration-500`}></div>
        <img
          src={team.logoUrl}
          alt={team.shortName}
          className={`w-20 h-20 mx-auto bg-white rounded-[1.5rem] mb-3 shadow-sm border ${isWinner ? 'border-emerald-500 border-2' : 'border-border'} relative z-10 object-contain p-4 group-hover/logo:scale-110 transition duration-500`}
        />
        {isWinner && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap tracking-widest uppercase">
            WINNER
          </div>
        )}
      </div>
    ) : (
      <div className={`w-20 h-20 mx-auto bg-surface-hover rounded-[1.5rem] flex items-center justify-center mb-3 shadow-inner border ${isWinner ? 'border-emerald-500 border-2' : 'border-border'}`}>
        <span className="text-xl font-black text-text-primary opacity-40 uppercase tracking-tighter">{team.shortName}</span>
      </div>
    );
  };

  return (
    <div className="bg-surface border border-border rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group hover:border-accent hover:shadow-xl hover:shadow-accent/5 transition-all duration-500">
      <div className="absolute top-0 right-0 w-48 h-48 bg-accent/[0.03] rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-1000"></div>

      {/* Header: Match Info */}
      <div className="flex justify-between items-start mb-10 z-10 relative">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary opacity-40 leading-none">{match.matchNumber || "League Match"} • {match.group || "T20"}</p>
          <p className="text-[9px] font-bold text-text-secondary opacity-30 uppercase tracking-tight italic">{match.venue || "Stadium"}</p>
        </div>

        {/* Live/Status Badge */}
        {isLive ? (
          <span className="px-5 py-1.5 bg-error/10 text-error border border-error/20 text-[9px] font-black rounded-full animate-pulse tracking-[0.2em] uppercase">
            LIVE NOW
          </span>
        ) : (
          <div className="flex flex-col items-end gap-1">
            <span className="px-4 py-1.5 bg-accent/5 text-accent text-[9px] font-black rounded-xl border border-accent/10 tracking-[0.15em] uppercase shadow-sm">
              {new Date(match.startTime).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
            <span className="text-[9px] font-black text-text-secondary opacity-30 uppercase tracking-widest">{new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
      </div>

      {/* Teams Section */}
      <div className="flex justify-between items-center mb-10 z-10 relative px-2">
        {/* Team A */}
        <div className="text-center flex-1 group/team">
          <TeamLogo team={match.teamA} isWinner={isCompleted && (match.winner?._id === match.teamA?._id)} />
          <h3 className="font-black text-sm text-text-primary leading-tight uppercase tracking-tighter group-hover/team:text-accent transition-colors">{match.teamA?.name || "TBD"}</h3>
          {isCompleted && (
            <p className="text-xs font-black text-text-secondary mt-1 opacity-60">
              {match.teamAScore?.r}/{match.teamAScore?.w}
              <span className="text-[10px] opacity-40">({match.teamAScore?.o})</span>
            </p>
          )}
        </div>

        <div className="px-4 text-center shrink-0">
          <div className="w-10 h-10 bg-background/50 rounded-full flex items-center justify-center border border-border shadow-inner">
            <span className="text-text-secondary font-black text-xs opacity-20 italic">VS</span>
          </div>
        </div>

        {/* Team B */}
        <div className="text-center flex-1 group/team">
          <TeamLogo team={match.teamB} isWinner={isCompleted && (match.winner?._id === match.teamB?._id || match.winner === match.teamB?._id)} />
          <h3 className="font-black text-sm text-text-primary leading-tight uppercase tracking-tighter group-hover/team:text-accent transition-colors">{match.teamB?.name || "TBD"}</h3>
          {isCompleted && (
            <p className="text-xs font-black text-text-secondary mt-1 opacity-60">
              {match.teamBScore?.r}/{match.teamBScore?.w} <span className="text-[10px] opacity-40">({match.teamBScore?.o})</span>
            </p>
          )}
        </div>
      </div>

      {/* Result Backdrop for completed matches */}
      {isCompleted && match.result && (
        <div className="mb-8 p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-center relative z-10">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{match.result}</p>
        </div>
      )}

      {/* Countdown / Action Area */}
      <div className="z-10 relative space-y-6">
        {timeLeft && isUpcoming && !match.isLocked ? (
          <div className="text-center py-5 bg-surface-hover/50 rounded-[1.5rem] border border-border/50 group-hover:bg-surface-hover transition-colors duration-500">
            <p className="text-text-secondary text-[9px] uppercase font-black tracking-[0.3em] mb-2 opacity-30 italic">Arena Locks In</p>
            <div className="text-2xl font-black text-text-primary tracking-[0.1em] font-mono">
              {(timeLeft as any).days ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="text-accent">{String((timeLeft as any).days).padStart(2, '0')}</span>
                  <span className="text-[10px] opacity-40 mt-1">DAYS LEFT</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1">
                  <span className={startsSoon ? "text-error" : "text-text-primary"}>{String(timeLeft.hours).padStart(2, '0')}</span>
                  <span className="opacity-20">:</span>
                  <span className={startsSoon ? "text-error" : "text-text-primary"}>{String(timeLeft.minutes).padStart(2, '0')}</span>
                  <span className="opacity-20">:</span>
                  <span className={startsSoon ? "text-error" : "text-text-primary"}>{String(timeLeft.seconds).padStart(2, '0')}</span>
                </span>
              )}
            </div>
          </div>
        ) : null}

        {renderButton()}
      </div>
    </div>
  );
}
