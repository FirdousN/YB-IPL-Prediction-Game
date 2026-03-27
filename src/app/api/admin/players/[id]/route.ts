import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db';
import Player from '@/src/models/Player';
import { getSession } from '@/src/lib/session';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(request);
    if (!session || (session.role !== 'admin' && (session as any).role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    await dbConnect();

    const player = await Player.findByIdAndUpdate(id, body, { new: true });
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 });

    return NextResponse.json(player);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(request);
    if (!session || (session.role !== 'admin' && (session as any).role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    await dbConnect();

    const player = await Player.findByIdAndDelete(id);
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 });

    return NextResponse.json({ message: 'Player deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
