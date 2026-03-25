import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db';
import Match from '@/src/models/Match';
import Team from '@/src/models/Team';

export const revalidate = 60; // Cache for 1 minute

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    // Ensure Team model is registered
    if (!Team) { console.log('Team model ensuring load...'); }

    // Fetch all internal matches
    const internalMatches = await Match.find()
      .populate('teamA')
      .populate('teamB')
      .sort({ startTime: 1 });

    // Format matches to match expected structure in site pages
    const formattedMatches = internalMatches.map(m => {
      const matchObj = m.toObject();
      return {
        id: matchObj._id,
        name: `${(matchObj.teamA as any).shortName} vs ${(matchObj.teamB as any).shortName}`,
        matchType: 't20',
        status: matchObj.status === 'UPCOMING' ? 'UPCOMING' : (matchObj.result || 'Match in progress'),
        venue: matchObj.venue || 'TBD',
        date: matchObj.startTime,
        dateTimeGMT: matchObj.startTime,
        teamInfo: [
          {
            name: (matchObj.teamA as any).name,
            shortname: (matchObj.teamA as any).shortName,
            img: (matchObj.teamA as any).logoUrl
          },
          {
            name: (matchObj.teamB as any).name,
            shortname: (matchObj.teamB as any).shortName,
            img: (matchObj.teamB as any).logoUrl
          }
        ],
        matchEnded: matchObj.status === 'COMPLETED'
      };
    });

    return NextResponse.json({
       series: { name: "TATA IPL 2026", id: "internal-ipl-2026" },
       matches: formattedMatches
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

