import { cookies } from 'next/headers';
import { verifyToken, JWTPayload } from './jwt';

/**
 * Set session cookie in Response headers
 */
export async function setSessionCookie(token: string) {
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
    });
}

import { NextRequest } from 'next/server';

/**
 * Get current session from cookies
 * Safe for Server Components and Route Handlers
 */
export async function getSession(request?: NextRequest): Promise<JWTPayload | null> {
    try {
        let token;
        if (request) {
            token = request.cookies.get('session')?.value;
        } else {
            const cookieStore = await cookies();
            token = cookieStore.get('session')?.value;
        }
        
        if (!token) return null;
        return await verifyToken(token);
    } catch (error) {
        console.error('[DEBUG] getSession error:', error);
        return null; // cookies() might throw if called outside of request context
    }
}

/**
 * Clear session cookie
 */
export async function clearSession() {
    const cookieStore = await cookies();
    cookieStore.delete('session');
}
