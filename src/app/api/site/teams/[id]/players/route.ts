import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db';
import Player from '@/src/models/Player';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const players = await Player.find({ team: id }).sort({ role: 1, name: 1 });
    return NextResponse.json(players);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
