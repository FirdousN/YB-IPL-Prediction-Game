import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db';
import Prediction from '@/src/models/Prediction';
import User from '@/src/models/User';
import { getSession } from '@/src/lib/session';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session || (session.role !== 'admin' && (session as any).role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    if (!User) { console.log('User model ensuring load...'); }

    // Fetch all predictions for the given matchId, populating the user that made them
    const predictions = await Prediction.find({ matchId: id })
      .populate('userId', 'name email participantId')
      .sort({ predictedAt: -1 });

    return NextResponse.json(predictions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
