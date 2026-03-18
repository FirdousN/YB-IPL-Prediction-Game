import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db';
import Match from '@/src/models/Match';
import { getSession } from '@/src/lib/session';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    // Determine filter based on query params if needed, or just return relevant matches
    // Requirement: List today's matches or upcoming.
    // Let's filter by status UPCOMING or LIVE by default

    const matches = await Match.find({
      status: { $in: ['UPCOMING', 'LIVE'] },
      endTime: { $gt: new Date() } // Only show matches that haven't ended? Or show all active?
    }).sort({ startTime: 1 });

    // Compute isLocked for each match (15 min rule)
    const now = new Date();
    const matchesWithLockStatus = matches.map(match => {
      const lockTime = new Date(match.startTime.getTime() - 15 * 60000);
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


export async function POST(request: NextRequest) {
  try {
    const session = await getSession() as { role?: string; participantId?: string; userId?: string; name?: string } | null;
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const body = await request.json();

    // Basic validation (optional: use Zod for stricter validation)
    if (!body.teamA || !body.teamB || !body.startTime || !body.endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const match = await Match.create(body);
    return NextResponse.json(match, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
