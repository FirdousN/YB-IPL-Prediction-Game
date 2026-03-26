import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db';
import Match from '@/src/models/Match';
import { getSession } from '@/src/lib/session';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession(request);
    if (!session || (session.role !== 'admin' && (session as any).role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const apiKey = process.env.CRICKETDATA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "CRICKETDATA_API_KEY missing" }, { status: 500 });
    }

    await dbConnect();
    const match = await Match.findById(id).populate('teamA teamB');
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // We need the CricAPI match ID. 
    // If we don't have it stored, we might need to find it by name/date or have stored it during sync.
    // Assuming we might need to search if it's not in a custom field.
    // For now, let's assume we can find it by searching matches on that date.
    
    const dateStr = new Date(match.startTime).toISOString().split('T')[0];
    const searchUrl = `https://api.cricapi.com/v1/matches?apikey=${apiKey}&offset=0`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.data) {
      return NextResponse.json({ error: 'Failed to fetch from CricAPI', raw: searchData }, { status: 500 });
    }

    // Find the match in CricAPI list
    const teamAName = (match.teamA as any).name.toLowerCase();
    const teamBName = (match.teamB as any).name.toLowerCase();
    
    const apiMatch = searchData.data.find((m: any) => {
      const mName = m.name.toLowerCase();
      const mDate = (m.dateTimeGMT || m.date).split('T')[0];
      return mDate === dateStr && mName.includes(teamAName) && mName.includes(teamBName);
    });

    if (!apiMatch || !apiMatch.id) {
       return NextResponse.json({ error: 'Match not found in CricAPI for this date/teams' }, { status: 404 });
    }

    // Fetch Squad Info
    const infoUrl = `https://api.cricapi.com/v1/match_info?apikey=${apiKey}&id=${apiMatch.id}`;
    const infoRes = await fetch(infoUrl);
    const infoData = await infoRes.json();

    if (!infoData.data || !infoData.data.players) {
       return NextResponse.json({ error: 'No player data available for this match yet' }, { status: 400 });
    }

    // Extract unique player names
    const playersArr: string[] = infoData.data.players.map((p: any) => p.name);
    const uniquePlayers = Array.from(new Set(playersArr)).sort();

    await Match.findByIdAndUpdate(id, { players: uniquePlayers });

    return NextResponse.json({ 
      message: 'Players updated successfully', 
      count: uniquePlayers.length,
      players: uniquePlayers 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
