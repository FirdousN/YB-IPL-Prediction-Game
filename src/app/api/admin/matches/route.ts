import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db';
import Match from '@/src/models/Match';
import Team from '@/src/models/Team';
import { getSession } from '@/src/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'admin' && (session as any).role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    if (!Team) { console.log('Team model ensuring load...'); }

    // Admins see all matches regardless of time filter, sorted newest first
    const matches = await Match.find()
      .populate('teamA')
      .populate('teamB')
      .sort({ startTime: -1 });

    return NextResponse.json(matches);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
