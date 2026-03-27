import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db';
import Team from '@/src/models/Team';
import Player from '@/src/models/Player';
import { getSession } from '@/src/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session || (session.role !== 'admin' && (session as any).role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');

    if (!matchId) {
      return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
    }

    const apiKey = process.env.CRICKETDATA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'CRICKETDATA_API_KEY missing' }, { status: 500 });
    }

    await dbConnect();

    // Fetch squad from CricAPI
    const res = await fetch(`https://api.cricapi.com/v1/squad?apikey=${apiKey}&id=${matchId}`);
    if (!res.ok) throw new Error('CricAPI squad fetch failed');
    const data = await res.json();

    if (data.status !== 'success' || !data.data || !data.data.squad) {
      return NextResponse.json({ error: 'Squad data not found or API error', raw: data }, { status: 404 });
    }

    // Process squad data to return a structured list for admin approval
    const squad = data.data.squad; // Array of { id, name, role... }
    
    return NextResponse.json({
      matchId,
      players: squad.map((p: any) => ({
        apiId: p.id,
        name: p.name,
        role: p.role || 'Batsman',
        battingStyle: p.battingStyle || '',
        bowlingStyle: p.bowlingStyle || '',
        country: p.country || '',
        imgUrl: p.playerImg || ''
      }))
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST to actually SAVE the approved players
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session || (session.role !== 'admin' && (session as any).role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { teamId, players } = await request.json();

    if (!teamId || !Array.isArray(players)) {
      return NextResponse.json({ error: 'teamId and players array required' }, { status: 400 });
    }

    await dbConnect();

    const results = [];
    for (const p of players) {
      // Upsert player by apiId or name+teamId
      const filter = p.apiId ? { apiId: p.apiId } : { name: p.name, team: teamId };
      const update = {
        name: p.name,
        role: p.role,
        team: teamId,
        apiId: p.apiId,
        battingStyle: p.battingStyle,
        bowlingStyle: p.bowlingStyle,
        country: p.country,
        imgUrl: p.imgUrl
      };

      const player = await Player.findOneAndUpdate(filter, update, {
        new: true,
        upsert: true
      });
      results.push(player);
    }

    return NextResponse.json({ message: `Successfully synced ${results.length} players`, count: results.length });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
