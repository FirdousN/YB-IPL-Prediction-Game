import { notFound } from "next/navigation";

export default function MatchDetailsPage({ params }: { params: { matchId: string } }) {
  // In a real implementation, fetch match details using params.matchId
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Match Details</h1>
      <p>Viewing details for match ID: {params.matchId}</p>
      {/* Add prediction form here later */}
    </div>
  );
}
