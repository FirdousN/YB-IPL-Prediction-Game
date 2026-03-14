"use client";

import { useEffect, useState } from "react";
import MatchCard from "@/src/components/MatchCard";

interface Match {
  _id: string;
  teamA: string;
  teamB: string;
  startTime: string;
  status: string;
  isLocked: boolean;
  // Mocked fields
  matchNumber?: string;
  group?: string;
  venue?: string;
}

interface Prediction {
  _id: string;
  matchId: Match;
  selectedOption: string;
}

export default function MatchesPage() {
  const [activeTab, setActiveTab] = useState<"TODAY" | "TOMORROW" | "MY_PICKS">("TODAY");
  const [matches, setMatches] = useState<Match[]>([]);
  const [myPicks, setMyPicks] = useState<Prediction[]>([]);
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
        setMatches(dataMatches);

        // Fetch My Picks (fail silently or user might not be logged in)
        try {
          const resPicks = await fetch("/api/predictions");
          if (resPicks.ok) {
            const dataPicks = await resPicks.json();
            setMyPicks(dataPicks);
          }
        } catch (e) {
          console.warn("Could not fetch picks", e);
        }

      } catch (err: unknown) {
        setError((err instanceof Error ? err.message : String(err)));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getFilteredMatches = () => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const startOfTomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const endOfTomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2);

    if (activeTab === "TODAY") {
      return matches.filter(m => {
        const d = new Date(m.startTime);
        return d >= startOfToday && d < endOfToday;
      });
    }
    if (activeTab === "TOMORROW") {
      return matches.filter(m => {
        const d = new Date(m.startTime);
        return d >= startOfTomorrow && d < endOfTomorrow;
      });
    }
    // Logic for returning matches for My Picks if needed, but the UI usually shows the prediction card
    // For now, let's just return matches from myPicks?
    // Wait, MatchCard expects a Match object.
    if (activeTab === "MY_PICKS") {
      return myPicks.map(p => ({
        ...p.matchId,
        // You might want to show what they picked? MatchCard doesn't support it yet.
        // Let's just list the matches they predicted on.
      }));
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
      <div className="flex justify-center space-x-1 bg-gray-800/50 p-1 rounded-xl max-w-md mx-auto backdrop-blur-sm border border-white/5">
        {(["TODAY", "TOMORROW", "MY_PICKS"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200
              ${activeTab === tab
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                : "text-gray-400 hover:text-white hover:bg-white/5"}
            `}
          >
            {tab === "MY_PICKS" ? "My Picks" : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Match Grid */}
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
    </div>
  );
}
