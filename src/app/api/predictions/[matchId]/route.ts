import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db';
import Prediction from '@/src/models/Prediction';
import { getSession } from '@/src/lib/session';
import mongoose from 'mongoose';

export async function GET(request: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  try {
    const { matchId } = await params;
    await dbConnect();
    const session = await getSession(request);
    
    // Allow any session with a valid 24-char hex userId (including static admin ID)
    if (!session || !session.userId || !/^[0-9a-fA-F]{24}$/.test(session.userId)) {
      return NextResponse.json({ error: 'Unauthorized: Valid session required' }, { status: 401 });
    }

    const prediction = await Prediction.findOne({ 
      userId: new mongoose.Types.ObjectId(session.userId), 
      matchId: new mongoose.Types.ObjectId(matchId) 
    });
    if (!prediction) {
      return NextResponse.json({ prediction: null }); // No prior prediction
    }
    return NextResponse.json({ prediction });
  } catch (error: any) {
    const msg = error.message || String(error);
    if (msg.includes("Cast to ObjectId failed")) {
       return NextResponse.json({ error: 'Invalid Session' }, { status: 401 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
