import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db';
import Prediction from '@/src/models/Prediction';
import Match from '@/src/models/Match';
import { getSession } from '@/src/lib/session';
import { z } from 'zod';

const predictionSchema = z.object({
  matchId: z.string(),
  answers: z.array(
    z.object({
      questionId: z.string(),
      value: z.string(),
    })
  )
});

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { matchId, answers } = predictionSchema.parse(body);

    const match = await Match.findById(matchId);
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Check Lock
    const now = new Date();
    // 30 minutes = 30 * 60 * 1000 ms
    const lockTime = new Date(match.startTime.getTime() - 30 * 60 * 1000);

    if (now > lockTime) {
      return NextResponse.json({ error: 'Predictions related to this match are now closed.' }, { status: 403 });
    }

    const prediction = await Prediction.findOneAndUpdate(
      { userId: session.userId, matchId },
      { answers, predictedAt: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json(prediction);

  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
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
