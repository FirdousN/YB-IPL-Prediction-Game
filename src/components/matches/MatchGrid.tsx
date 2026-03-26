"use client";

import MatchCard from "@/src/components/MatchCard";

interface MatchGridProps {
  matches: any[];
  emptyMessage?: string;
}

export default function MatchGrid({ matches, emptyMessage = "No matches found for this criteria." }: MatchGridProps) {
  if (matches.length === 0) {
    return (
      <div className="text-center py-20 bg-surface-hover/10 rounded-[3rem] border-2 border-dashed border-border/50 backdrop-blur-sm group transition-all hover:bg-surface-hover/20">
        <div className="w-16 h-16 bg-surface-hover rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border group-hover:scale-110 transition-transform duration-500">
           <span className="text-2xl opacity-20 italic font-black text-text-secondary">VS</span>
        </div>
        <p className="text-text-secondary font-black text-lg uppercase tracking-tight opacity-40 italic">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {matches.map((match) => (
        <MatchCard 
          key={match._id} 
          match={match} 
          prediction={match.prediction}
        />
      ))}
    </div>
  );
}
