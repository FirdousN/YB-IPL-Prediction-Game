import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db';
import Team from '@/src/models/Team';
import { getSession } from '@/src/lib/session';
import { z } from 'zod';

const teamUpdateSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  shortName: z.string().min(2).max(5).toUpperCase().optional(),
  logoUrl: z.string().optional(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession(request);
    if (!session || (session.role !== 'admin' && (session as any).role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const body = await request.json();
    const parsed = teamUpdateSchema.parse(body);

    const team = await Team.findByIdAndUpdate(id, parsed, { new: true });
    
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    return NextResponse.json(team);
  } catch (error: any) {
    return NextResponse.json({ error: error instanceof z.ZodError ? error.issues : error.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession(request);
    if (!session || (session.role !== 'admin' && (session as any).role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const team = await Team.findByIdAndDelete(id);
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    return NextResponse.json({ message: 'Team deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
