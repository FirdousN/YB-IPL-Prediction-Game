"use client";

import MatchGrid from "./MatchGrid";

interface CompletedSectionProps {
  matches: any[];
}

export default function CompletedSection({ matches }: CompletedSectionProps) {
  return (
    <div className="space-y-6">
      <MatchGrid 
        matches={matches} 
        emptyMessage="No completed matches found in this category."
      />
    </div>
  );
}
