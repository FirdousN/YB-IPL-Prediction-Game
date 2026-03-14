import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const SECRET_KEY = process.env.JWT_SECRET!;
const key = new TextEncoder().encode(SECRET_KEY);

export async function signSession(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Session lasts 7 days
    .sign(key);
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;
  return await verifySession(session);
}

export async function updateSession(request: NextRequest, sessionPayload?: Record<string, unknown>) {
  const session = request.cookies.get('session')?.value;
  if (!session) return;

  // If payload is provided, use it, otherwise verify
  const parsed = sessionPayload || await verifySession(session);
  if (!parsed) return;
  
  const res = NextResponse.next();
  res.cookies.set({
    name: 'session',
    value: session,
    httpOnly: true,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  return res;
}
