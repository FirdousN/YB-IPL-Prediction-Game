import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db';
import Team from '@/src/models/Team';
import { getSession } from '@/src/lib/session';

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
    console.log('[DEBUG] request.cookies:', request.cookies.getAll());
    const session = await getSession(request);
    console.log('[DEBUG] POST /api/admin/teams -> session:', session);
    
    if (!session || (session.role !== 'admin' && (session as any).role !== 'ADMIN')) {
      console.log('[DEBUG] Unauthorized. Session is:', session);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const body = await request.json();
    const { name, shortName, logoUrl } = body;

    const team = new Team({ name, shortName, logoUrl });
    await team.save();

    return NextResponse.json(team, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
