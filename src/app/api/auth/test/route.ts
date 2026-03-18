import { NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '../../../../lib/db';

const schema = z.object({ test: z.string() });

export async function POST(req: any) {
  try {
    await dbConnect();
    const body = await req.json();
    schema.parse(body);
    return NextResponse.json({ message: "DB + Zod Success" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
