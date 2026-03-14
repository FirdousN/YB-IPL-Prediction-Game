import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db';
import Prediction from '@/src/models/Prediction';
import Match from '@/src/models/Match';
import { verifySession } from '@/src/lib/auth';
import { z } from 'zod';

const predictionSchema = z.object({
  matchId: z.string(),
  selectedOption: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const cookie = request.cookies.get('session')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const session = await verifySession(cookie) as { role?: string; participantId?: string; userId?: string; name?: string } | null;
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { matchId, selectedOption } = predictionSchema.parse(body);

    const match = await Match.findById(matchId);
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Check Lock
    const now = new Date();
    // 15 minutes = 15 * 60 * 1000 ms
    const lockTime = new Date(match.startTime.getTime() - 15 * 60 * 1000);

    if (now > lockTime) {
      return NextResponse.json({ error: 'Predictions related to this match are now closed.' }, { status: 403 });
    }

    // Upsert prediction (User can change prediction before lock time?)
    // Requirement says "strict prediction locking". Usually implies once locked, no change.
    // Does it imply once submitted no change? "15 mins before start" is the lock condition.
    // So user should be able to update their prediction until the lock time.

    const prediction = await Prediction.findOneAndUpdate(
      { userId: session.userId, matchId },
      { selectedOption, predictedAt: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json(prediction);

  } catch (error: unknown) {
    // Check for duplicate key error just in case, though upsert handles it.
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const cookie = request.cookies.get('session')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const session = await verifySession(cookie) as { role?: string; participantId?: string; userId?: string; name?: string } | null;
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all predictions for this user
    const predictions = await Prediction.find({ userId: session.userId }).populate('matchId');
    return NextResponse.json(predictions);
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
