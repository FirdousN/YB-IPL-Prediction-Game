import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/src/lib/jwt';
import { setSessionCookie } from '@/src/lib/session';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (username === adminUsername && password === adminPassword) {
      // Create session
      const token = await signToken({ userId: 'admin', role: 'admin' });
      await setSessionCookie(token);

      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}