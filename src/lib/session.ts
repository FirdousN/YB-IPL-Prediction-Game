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

/**
 * Get current session from cookies
 * Safe for Server Components and Route Handlers
 */
export async function getSession(): Promise<JWTPayload | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('session')?.value;
        if (!token) return null;
        return await verifyToken(token);
    } catch (error) {
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
