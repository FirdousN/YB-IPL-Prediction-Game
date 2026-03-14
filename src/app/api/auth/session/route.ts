import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/src/lib/auth';

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get('session')?.value;
  if (!cookie) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const session = await verifySession(cookie);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, user: session });
}
