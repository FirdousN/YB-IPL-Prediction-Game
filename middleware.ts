import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession, verifySession } from '@/src/lib/auth';


interface SessionPayload {
    userId: string;
    role: string;
    name: string;
    [key: string]: unknown; // Allow for other JWT claims
}

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const isApiRequest = path.startsWith('/api');

    // Define protected routes
    const isProtectedAdmin = path.startsWith('/admin') || path.startsWith('/api/admin');
    const isProtectedUser = path.startsWith('/site') || path.startsWith('/api/predictions');

    // Check for session
    const cookie = request.cookies.get('session')?.value;
    const session = cookie ? await verifySession(cookie) as SessionPayload | null : null;

    // 1. Admin Route Protection
    if (isProtectedAdmin) {
        // Allow access to admin login page and its API counterpart
        if (path === '/admin/login' || path === '/api/admin/login') {
            // BUT if an admin is already logged in, they shouldn't be at the login page
            if (session?.role === 'ADMIN' && path === '/admin/login') {
                return NextResponse.redirect(new URL('/admin/dashboard', request.url));
            }
            return NextResponse.next();
        }

        if (!session || session.role !== 'ADMIN') {
            if (isApiRequest) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }

    // 2. User Route Protection
    if (isProtectedUser) {
        if (!session) {
            if (isApiRequest) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // 3. Auth Route Redirection (if already logged in)
    if (path === '/login' || path === '/register') {
        if (session) {
            if (session.role === 'ADMIN') {
                return NextResponse.redirect(new URL('/admin/dashboard', request.url));
            } else {
                return NextResponse.redirect(new URL('/site/matches', request.url));
            }
        }
    }

    // Update session expiration if valid (only if we haven't redirected)
    const updatedRes = await updateSession(request, session || undefined);
    return updatedRes || NextResponse.next();
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/site/:path*',
        '/api/admin/:path*',
        '/api/predictions/:path*',
        '/login',
        '/register',
    ],
};
