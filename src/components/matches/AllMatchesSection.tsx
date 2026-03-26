"use client";

import MatchGrid from "./MatchGrid";

interface AllMatchesSectionProps {
  matches: any[];
}

export default function AllMatchesSection({ matches }: AllMatchesSectionProps) {
  return (
    <div className="space-y-6">
      <MatchGrid 
        matches={matches} 
        emptyMessage="No matches found in the entire repository."
      />
    </div>
  );
}
