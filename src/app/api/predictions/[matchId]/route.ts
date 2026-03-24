import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db';
import Prediction from '@/src/models/Prediction';
import { getSession } from '@/src/lib/session';

export async function GET(request: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  try {
    const { matchId } = await params;
    await dbConnect();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prediction = await Prediction.findOne({ userId: session.userId, matchId });
    if (!prediction) {
      return NextResponse.json({ answers: null }); // No prior prediction
    }
    return NextResponse.json({ answers: prediction.answers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
