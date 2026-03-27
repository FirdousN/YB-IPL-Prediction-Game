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

    let query: any = { isArchived: { $ne: true } };

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

    // Compute isLocked and computedStatus for each match
    const now = new Date();
    const matchesWithStatus = matches.map(match => {
      const lockTime = new Date(match.startTime.getTime() - 30 * 60000); // 30 mins
      const startTime = new Date(match.startTime);
      const endTime = new Date(match.endTime || new Date(startTime.getTime() + 4 * 60 * 60 * 1000)); // Default 4h if no endTime

      let computedStatus = match.status;

      // Auto-transition UPCOMING to LIVE
      if (match.status === 'UPCOMING' && now >= startTime && now < endTime) {
        computedStatus = 'LIVE';
      }
      // Note: COMPLETED should usually be manual, but we show LIVE if it's within window

      return {
        ...match.toObject(),
        isLocked: now > lockTime,
        computedStatus: computedStatus
      };
    });

    return NextResponse.json(matchesWithStatus);
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
