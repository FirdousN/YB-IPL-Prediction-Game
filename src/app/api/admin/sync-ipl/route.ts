import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db';
import Match from '@/src/models/Match';
import Team from '@/src/models/Team';
import { getSession } from '@/src/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session || (session.role !== 'admin' && (session as any).role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const apiKey = process.env.CRICKETDATA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "CRICKETDATA_API_KEY missing" }, { status: 500 });
    }

    await dbConnect();

    // 1. Fetch current teams for mapping
    const dbTeams = await Team.find();
    
    // 2. Fetch matches from CricAPI
    const res = await fetch(`https://api.cricapi.com/v1/matches?apikey=${apiKey}&offset=0`);
    if (!res.ok) throw new Error('CricAPI fetch failed');
    const data = await res.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      return NextResponse.json({ error: 'Invalid data from CricAPI', raw: data }, { status: 500 });
    }

    // 3. Filter for IPL 2026 matches starting March 28th
    const iplMatches = data.data.filter((m: any) => {
      const name = m.name.toLowerCase();
      const date = new Date(m.dateTimeGMT || m.date);
      // IPL 2026 start date: March 28th
      const isIpl = name.includes('ipl') || name.includes('indian premier league');
      const isCorrectYear = date.getUTCFullYear() === 2026;
      const isFutureOrToday = date >= new Date('2026-03-27T18:30:00Z'); // Slightly before 28th for padding
      return isIpl && isCorrectYear && isFutureOrToday;
    });

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[]
    };

    for (const m of iplMatches) {
      try {
        // Find team IDs
        let teamAId = "";
        let teamBId = "";

        if (m.teamInfo && m.teamInfo.length >= 2) {
          const apiT1 = m.teamInfo[0];
          const apiT2 = m.teamInfo[1];

          teamAId = dbTeams.find(t => 
            t.name.toLowerCase() === apiT1.name.toLowerCase() || 
            t.shortName.toLowerCase() === apiT1.shortname.toLowerCase()
          )?._id.toString() || "";

          teamBId = dbTeams.find(t => 
            t.name.toLowerCase() === apiT2.name.toLowerCase() || 
            t.shortName.toLowerCase() === apiT2.shortname.toLowerCase()
          )?._id.toString() || "";
        }

        if (!teamAId || !teamBId) {
          results.skipped++;
          continue;
        }

        const startTime = new Date(m.dateTimeGMT || m.date);
        const endTime = new Date(startTime.getTime() + 4 * 60 * 60 * 1000);

        // Standard questions for all matches
        const teamAName = dbTeams.find(t => t._id.toString() === teamAId)?.name || "Team A";
        const teamBName = dbTeams.find(t => t._id.toString() === teamBId)?.name || "Team B";

        const defaultQuestions = [
          { text: "Who will win the match?", type: "OPTIONS" as const, options: [teamAName, teamBName], points: 20, ruleType: "EXACT", unit: "TEAM", result: "" },
          { text: "Who will score the most runs in this match?", type: "TEXT" as const, options: [], points: 20, ruleType: "EXACT", unit: "PLAYER", result: "" },
          { text: "Who will take the most wickets in this match?", type: "TEXT" as const, options: [], points: 20, ruleType: "EXACT", unit: "PLAYER", result: "" },
          { text: "Total runs scored by the winning team?", type: "TEXT" as const, options: [], points: 30, ruleType: "NEAREST", maxRange: 30, unit: "RUNS", result: "" },
          { text: "Player / Man of the Match?", type: "TEXT" as const, options: [], points: 20, ruleType: "EXACT", unit: "PLAYER", result: "" }
        ];

        // Upsert Match
        const matchData = {
          teamA: teamAId,
          teamB: teamBId,
          startTime,
          endTime,
          venue: m.venue || "TBA",
          group: "IPL 2026",
          status: 'UPCOMING'
        };

        const existingMatch = await Match.findOne({
          teamA: teamAId,
          teamB: teamBId,
          startTime: {
            $gte: new Date(startTime.getTime() - 2 * 60 * 60 * 1000),
            $lte: new Date(startTime.getTime() + 2 * 60 * 60 * 1000)
          }
        });

        if (existingMatch) {
          await Match.findByIdAndUpdate(existingMatch._id, matchData);
          results.updated++;
        } else {
          await Match.create({ ...matchData, questions: defaultQuestions });
          results.created++;
        }
      } catch (err: any) {
        results.errors.push(`Error processing ${m.name}: ${err.message}`);
      }
    }

    return NextResponse.json({ message: 'Sync completed', results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
