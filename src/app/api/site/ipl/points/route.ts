import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db';
import Match from '@/src/models/Match';
import Team from '@/src/models/Team';

export const revalidate = 60;

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const teams = await Team.find().sort({ name: 1 });
    const matches = await Match.find({ status: { $in: ['COMPLETED', 'ABANDONED'] } });

    const teamStats: Record<string, any> = {};
    teams.forEach(t => {
      teamStats[t._id.toString()] = {
        id: t._id,
        teamname: t.name,
        shortname: t.shortName,
        img: t.logoUrl,
        matches: 0,
        wins: 0,
        loss: 0,
        nr: 0,
        points: 0,
        runsScored: 0,
        oversFaced: 0,
        runsConceded: 0,
        oversBowled: 0,
        nrrs: "0.000"
      };
    });

    const parseOvers = (oversStr: string) => {
      if (!oversStr) return 0;
      const [ov, balls] = oversStr.split('.').map(Number);
      return (ov || 0) + (balls || 0) / 6;
    };

    matches.forEach(m => {
      const idA = m.teamA.toString();
      const idB = m.teamB.toString();

      if (teamStats[idA]) teamStats[idA].matches += 1;
      if (teamStats[idB]) teamStats[idB].matches += 1;

      if (m.status === 'ABANDONED') {
        if (teamStats[idA]) { teamStats[idA].nr += 1; teamStats[idA].points += 1; }
        if (teamStats[idB]) { teamStats[idB].nr += 1; teamStats[idB].points += 1; }
      } else if (m.status === 'COMPLETED' && m.winner) {
        const winnerId = m.winner.toString();
        const loserId = winnerId === idA ? idB : idA;

        if (teamStats[winnerId]) { teamStats[winnerId].wins += 1; teamStats[winnerId].points += 2; }
        if (teamStats[loserId]) { teamStats[loserId].loss += 1; }

        // NRR Calculation
        if (m.teamAScore && m.teamBScore) {
          const oversFacedA = m.teamAScore.w === 10 ? 20 : parseOvers(m.teamAScore.o || "0");
          const oversFacedB = m.teamBScore.w === 10 ? 20 : parseOvers(m.teamBScore.o || "0");

          if (teamStats[idA]) {
            teamStats[idA].runsScored += m.teamAScore.r || 0;
            teamStats[idA].oversFaced += oversFacedA;
            teamStats[idA].runsConceded += m.teamBScore.r || 0;
            teamStats[idA].oversBowled += oversFacedB;
          }
          if (teamStats[idB]) {
            teamStats[idB].runsScored += m.teamBScore.r || 0;
            teamStats[idB].oversFaced += oversFacedB;
            teamStats[idB].runsConceded += m.teamAScore.r || 0;
            teamStats[idB].oversBowled += oversFacedA;
          }
        }
      }
    });

    const pointsTable = Object.values(teamStats).map((t: any) => {
      let nrr = 0;
      if (t.oversFaced > 0 && t.oversBowled > 0) {
        nrr = (t.runsScored / t.oversFaced) - (t.runsConceded / t.oversBowled);
      }
      return {
        ...t,
        nrrs: nrr.toFixed(3)
      };
    }).sort((a: any, b: any) => {
      if (b.points !== a.points) return b.points - a.points;
      if (parseFloat(b.nrrs) !== parseFloat(a.nrrs)) return parseFloat(b.nrrs) - parseFloat(a.nrrs);
      return a.shortname.localeCompare(b.shortname);
    });

    return NextResponse.json({
       series: { name: "TATA IPL 2026", id: "internal-ipl-2026" },
       points: pointsTable
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

