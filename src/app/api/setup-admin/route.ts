// TypeScript Route
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db';
import User from '@/src/models/User';

export async function GET(request: NextRequest) {
  // Security: Only allow in development or via a secret query param if needed
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone');

  if (!phone) {
    return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
  }

  try {
    await dbConnect();
    const user = await User.findOneAndUpdate(
      { phone },
      { role: 'ADMIN' },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `User ${user.name} (${user.phone}) is now an ADMIN.`,
      user
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
