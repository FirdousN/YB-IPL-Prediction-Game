import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db';
import Match from '@/src/models/Match';
import { z } from 'zod';
import { getSession } from '@/src/lib/session';

const createMatchSchema = z.object({
  teamA: z.string().min(1),
  teamB: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  question: z.string().min(1),
  options: z.array(z.string()).min(2),
});

// Helper to check admin
async function isAdmin(request: NextRequest) {
  const session = await getSession();
  return session && session.role === 'admin';
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    // Admin sees all matches
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const matches = await Match.find().sort({ startTime: -1 });
    return NextResponse.json(matches);
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error) }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createMatchSchema.parse(body);

    const match = await Match.create(parsed);
    return NextResponse.json(match, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 400 });
  }
}
