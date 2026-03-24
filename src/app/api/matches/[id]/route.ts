import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db';
import Match from '@/src/models/Match';
import Team from '@/src/models/Team';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    if (!Team) console.log('Team model ensuring load...');

    const match = await Match.findById(id)
      .populate('teamA')
      .populate('teamB');

    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

    // Compute isLocked (30 min rule)
    const now = new Date();
    const lockTime = new Date(match.startTime.getTime() - 30 * 60000); // 30 mins
    const matchWithLock = {
      ...match.toObject(),
      isLocked: now > lockTime
    };

    return NextResponse.json(matchWithLock);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
