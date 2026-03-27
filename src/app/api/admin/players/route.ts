import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db';
import Player from '@/src/models/Player';
import { getSession } from '@/src/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session || (session.role !== 'admin' && (session as any).role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    await dbConnect();

    const query = teamId ? { team: teamId } : {};
    const players = await Player.find(query).sort({ name: 1 });

    return NextResponse.json(players);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session || (session.role !== 'admin' && (session as any).role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    await dbConnect();

    const player = await Player.create(body);
    return NextResponse.json(player);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
