import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db';
import Player from '@/src/models/Player';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const players = await Player.find({ team: params.id }).sort({ role: 1, name: 1 });
    return NextResponse.json(players);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
