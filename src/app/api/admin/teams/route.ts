import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db';
import Team from '@/src/models/Team';
import { getSession } from '@/src/lib/session';
import { z } from 'zod';

const teamSchema = z.object({
  name: z.string().min(2).max(50),
  shortName: z.string().min(2).max(5).toUpperCase(),
  logoUrl: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const teams = await Team.find().sort({ name: 1 });
    return NextResponse.json(teams);
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

    await dbConnect();
    const body = await request.json();
    const parsed = teamSchema.parse(body);

    const team = new Team(parsed);
    await team.save();

    return NextResponse.json(team, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error instanceof z.ZodError ? error.issues : error.message }, { status: 400 });
  }
}
