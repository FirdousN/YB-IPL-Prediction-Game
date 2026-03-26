"use client";

import MatchGrid from "./MatchGrid";

interface MyPredictionsSectionProps {
  matches: any[];
}

export default function MyPredictionsSection({ matches }: MyPredictionsSectionProps) {
  return (
    <div className="space-y-6">
      <MatchGrid 
        matches={matches} 
        emptyMessage="You haven't participated in any predictions yet. Time to make your mark!"
      />
    </div>
  );
}
