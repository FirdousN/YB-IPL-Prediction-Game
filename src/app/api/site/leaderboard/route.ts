import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db';
import User from '@/src/models/User';

export async function GET() {
  try {
    await dbConnect();
    // Fetch top 10 users by points, excluding admins if necessary
    const users = await User.find({ role: 'user' })
      .sort({ points: -1, name: 1 })
      .limit(10)
      .select('name points');

    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
