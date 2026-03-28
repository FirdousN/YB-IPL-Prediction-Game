"use client";

import { useEffect, useState, useMemo } from "react";
import MatchFilterSort from "@/src/components/matches/MatchFilterSort";
import UpcomingSection from "@/src/components/matches/UpcomingSection";
import LiveSection from "@/src/components/matches/LiveSection";
import CompletedSection from "@/src/components/matches/CompletedSection";
import MyPredictionsSection from "@/src/components/matches/MyPredictionsSection";
import AllMatchesSection from "@/src/components/matches/AllMatchesSection";

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
  totalPoints?: number;
  isWinner?: boolean;
  rank?: number;
}

type TabType = "ALL" | "UPCOMING" | "LIVE" | "COMPLETED" | "MY_PREDICTIONS";

export default function MatchesPage() {
  const [activeTab, setActiveTab] = useState<TabType>("UPCOMING");
  const [matches, setMatches] = useState<Match[]>([]);
  const [myPicks, setMyPicks] = useState<Prediction[]>([]);
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter & Sort State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date-asc");
  const [filterTeam, setFilterTeam] = useState("");
  const [filterTournament, setFilterTournament] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const resMatches = await fetch("/api/matches");
        if (!resMatches.ok) throw new Error("Failed to fetch matches");
        const dataMatches = await resMatches.json();
        setMatches(dataMatches);

        try {
          const resPicks = await fetch("/api/predictions", { cache: "no-store" });
          if (resPicks.ok) setMyPicks(await resPicks.json());
        } catch (e) {
          console.error('[MatchesPage] Predictions fetch error:', e);
        }

        try {
          const resLive = await fetch("/api/live-matches");
          if (resLive.ok) {
            const dataLive = await resLive.json();
            if (dataLive.data) setLiveMatches(dataLive.data);
          }
        } catch (e) { }

      } catch (err: unknown) {
        setError((err instanceof Error ? err.message : String(err)));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Unique Teams & Tournaments for filters
  const teamsList = useMemo(() => {
    const names = new Set<string>();
    matches.forEach(m => {
      if (m.teamA?.name) names.add(m.teamA.name);
      if (m.teamB?.name) names.add(m.teamB.name);
    });
    return Array.from(names);
  }, [matches]);

  const tournamentsList = useMemo(() => {
    const groups = new Set<string>();
    matches.forEach(m => {
      if (m.group) groups.add(m.group);
    });
    return Array.from(groups);
  }, [matches]);

  // Derived Filtering Logic
  const processedMatches = useMemo(() => {
    // Merge prediction data into matches for all views
    let enhancedMatches = matches.map(m => {
      const pred = myPicks.find(p => String(p.matchId?._id || p.matchId) === String(m._id));
      return {
        ...m,
        prediction: pred ? { answers: pred.answers, totalPoints: pred.totalPoints, isWinner: pred.isWinner, rank: pred.rank } : undefined
      };
    });

    let filtered = [...enhancedMatches];

    // 1. Tab Filtering
    if (activeTab === "UPCOMING") {
      filtered = filtered.filter(m => (m as any).computedStatus?.toUpperCase() === "UPCOMING");
    } else if (activeTab === "LIVE") {
      filtered = filtered.filter(m => (m as any).computedStatus?.toUpperCase() === "LIVE");
    } else if (activeTab === "COMPLETED") {
      filtered = filtered.filter(m => m.status?.toUpperCase() === "COMPLETED" || m.status?.toUpperCase() === "ABANDONED");
    } else if (activeTab === "MY_PREDICTIONS") {
      filtered = filtered.filter(m => m.prediction !== undefined);
    }
    // "ALL" tab shows everything (no filter)

    // 2. Global Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.teamA.name.toLowerCase().includes(q) || 
        m.teamB.name.toLowerCase().includes(q) || 
        m.venue?.toLowerCase().includes(q)
      );
    }

    // 3. Team Filter
    if (filterTeam) {
      filtered = filtered.filter(m => m.teamA.name === filterTeam || m.teamB.name === filterTeam);
    }

    // 4. Tournament Filter
    if (filterTournament) {
      filtered = filtered.filter(m => m.group === filterTournament);
    }

    // 5. Sorting
    filtered.sort((a, b) => {
      const timeA = new Date(a.startTime).getTime();
      const timeB = new Date(b.startTime).getTime();
      return sortBy === "date-asc" ? timeA - timeB : timeB - timeA;
    });

    return filtered;
  }, [matches, activeTab, myPicks, searchQuery, filterTeam, filterTournament, sortBy]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
    </div>
  );

  if (error) return <div className="text-center text-error p-8 font-bold">Error: {error}</div>;

  return (
    <div className="space-y-8 pb-20">
      {/* Tab Navigation */}
      <div className="flex justify-center space-x-1 bg-surface-hover/30 p-1.5 rounded-2xl max-w-2xl mx-auto backdrop-blur-md border border-border overflow-x-auto no-scrollbar shadow-sm">
        {(["ALL", "UPCOMING", "LIVE", "COMPLETED", "MY_PREDICTIONS"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              flex-1 py-3 px-6 rounded-xl text-[10px] font-black transition-all duration-300 uppercase tracking-[0.15em] min-w-max flex items-center justify-center
              ${activeTab === tab
                ? "bg-accent text-white shadow-lg shadow-accent/20 scale-105"
                : "text-text-primary hover:text-accent hover:bg-surface-hover/50"}
            `}
          >
            {tab === "MY_PREDICTIONS" ? "MY PREDICTIONS" : tab}
            {(tab === "LIVE" && (liveMatches.length > 0 || matches.some(m => (m as any).computedStatus === 'LIVE' || m.status === 'LIVE'))) && <span className="ml-2 w-1.5 h-1.5 rounded-full bg-red-500 inline-block animate-pulse shrink-0"></span>}
          </button>
        ))}
      </div>

      {/* Filter & Sort Bar */}
      <MatchFilterSort 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
        filterTeam={filterTeam}
        setFilterTeam={setFilterTeam}
        filterTournament={filterTournament}
        setFilterTournament={setFilterTournament}
        teams={teamsList}
        tournaments={tournamentsList}
      />

      {/* Dynamic Sections */}
      <div className="min-h-[400px]">
        {activeTab === "ALL" && <AllMatchesSection matches={processedMatches} />}
        {activeTab === "UPCOMING" && <UpcomingSection matches={processedMatches} />}
        {activeTab === "LIVE" && <LiveSection matches={processedMatches} liveMatches={liveMatches} />}
        {activeTab === "COMPLETED" && <CompletedSection matches={processedMatches} />}
        {activeTab === "MY_PREDICTIONS" && <MyPredictionsSection matches={processedMatches} />}
      </div>
    </div>
  );
}
