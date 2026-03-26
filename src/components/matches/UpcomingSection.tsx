"use client";

import MatchGrid from "./MatchGrid";

interface UpcomingSectionProps {
  matches: any[];
}

export default function UpcomingSection({ matches }: UpcomingSectionProps) {
  return (
    <div className="space-y-6">
      <MatchGrid 
        matches={matches} 
        emptyMessage="No upcoming matches scheduled for this period."
      />
    </div>
  );
}
