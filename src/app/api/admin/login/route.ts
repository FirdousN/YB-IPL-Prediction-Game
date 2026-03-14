
import { NextRequest, NextResponse } from 'next/server';
import { signSession } from '@/src/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Hardcoded Dev Credentials
    const DEV_USER = "dev_admin";
    const DEV_PASS = "Dev_Yo@572_#Secure";

    if (username === DEV_USER && password === DEV_PASS) {
      // Create Mock Admin Session
      const sessionPayload = {
        userId: 'dev-admin-id', // Mock ID
        role: 'ADMIN', // Critical for Admin Access
        name: 'Dev Admin',
      };

      const token = await signSession(sessionPayload);

      // Set Cookie
      const cookieStore = await cookies();
      cookieStore.set('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 Day
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal error" }, { status: 500 });
  }
}
