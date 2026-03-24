import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, JWTPayload } from '@/src/lib/jwt';

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const isApiRequest = path.startsWith('/api');

    // Define protected routes
    const isProtectedAdmin = path.startsWith('/admin') || path.startsWith('/api/admin');
    const isProtectedUser = path.startsWith('/dashboard') || path.startsWith('/site') || path.startsWith('/api/predictions');

    // Check for session
    const cookie = request.cookies.get('session')?.value;
    const session = cookie ? await verifyToken(cookie) : null;

    // 1. Admin Route Protection
    if (isProtectedAdmin) {
        if (path === '/admin/login' || path === '/api/admin/login') {
            if (session?.role === 'admin' && path === '/admin/login') {
                return NextResponse.redirect(new URL('/admin', request.url));
            }
            return NextResponse.next();
        }

        if (!session || session.role !== 'admin') {
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
            if (session.role === 'admin') {
                return NextResponse.redirect(new URL('/admin/dashboard', request.url));
            } else {
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/dashboard/:path*',
        '/site/:path*',
        '/api/admin/:path*',
        '/api/predictions/:path*',
        '/login',
        '/register',
    ],
};
