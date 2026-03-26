import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db';
import Match from '@/src/models/Match';
import Team from '@/src/models/Team'; // Ensure Team is registered for population
import { getSession } from '@/src/lib/session';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Auto-register Team model if not yet registered in this route context
    if (!Team) { console.log('Team model ensuring load...'); }

    const { searchParams } = new URL(request.url);
    const filterToday = searchParams.get('today');
    const getAll = searchParams.get('all') === 'true';

    let query: any = {};
    
    if (!getAll) {
      // Allow UPCOMING, LIVE, and COMPLETED by default for the user dashboard
      query.status = { $in: ['UPCOMING', 'LIVE', 'COMPLETED'] };
    }

    if (filterToday === 'true') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      query.startTime = { $gte: startOfDay, $lte: endOfDay };
    }

    console.log('[DEBUG] GET /api/matches query:', JSON.stringify(query));
    const allMatches = await Match.find({});
    console.log('[DEBUG] GET /api/matches ALL matches count:', allMatches.length);

    const matches = await Match.find(query)
      .populate('teamA')
      .populate('teamB')
      .populate('winner')
      .sort({ startTime: 1 });

    console.log('[DEBUG] GET /api/matches returned:', matches.length);

    // Compute isLocked for each match (30 min rule)
    const now = new Date();
    const matchesWithLockStatus = matches.map(match => {
      const lockTime = new Date(match.startTime.getTime() - 30 * 60000); // 30 mins
      return {
        ...match.toObject(),
        isLocked: now > lockTime
      };
    });

    return NextResponse.json(matchesWithLockStatus);
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}

const matchSchema = z.object({
  teamA: z.string(),
  teamB: z.string(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  venue: z.string().optional(),
  group: z.string().optional(),
  status: z.enum(['UPCOMING', 'LIVE', 'COMPLETED', 'ABANDONED']).default('UPCOMING'),
  winner: z.string().optional().transform((val: string | undefined) => val === "" ? undefined : val),
  questions: z.array(z.any()).optional().default([]),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request) as { role?: string; participantId?: string; userId?: string; name?: string } | null;
    if (!session || (session.role !== 'ADMIN' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const body = await request.json();
    const parsed = matchSchema.parse(body);

    const match = await Match.create(parsed);
    return NextResponse.json(match, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 400 });
  }
}
