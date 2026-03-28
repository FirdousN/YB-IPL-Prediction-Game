import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/src/lib/jwt';

export default async function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const isApiRequest = path.startsWith('/api');

    // Define protected routes
    const isProtectedAdmin = path.startsWith('/admin') || path.startsWith('/api/admin');
    const isProtectedUser = path.startsWith('/site') || path.startsWith('/api/predictions');

    // Check for session
    const cookie = request.cookies.get('token')?.value;
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

    // 2. User Route Protection - STRICTOR but allow admins to VIEW
    if (isProtectedUser) {
        if (!session) {
            if (isApiRequest) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            // If accessing a prediction page, redirect to login
            return NextResponse.redirect(new URL('/login', request.url));
        }
        // Admins are allowed to VIEW site pages (for testing), but not vice-versa
    }

    // 3. Auth Route Redirection
    if (path === '/login' || path === '/register') {
        if (session) {
            // ONLY redirect if the user is already logged in AND 
            // the destination is specifically the login page which they don't need anymore.
            // If they are admin, they go to admin dashboard IF THEY ARE ON THE ADMIN LOGIN path.
            // But if they are on the USER login path, we should be careful.
            
            // To solve "Admin redirect loop": Only redirect to Admin Dashboard if they were 
            // trying to access /admin/login OR if they explicitly navigated to /login while admin.
            if (session.role === 'admin') {
                // If they are on /login, we let them be or redirect to admin ONLY if they came from admin.
                // For now, let's just send them to admin dashboard to keep them in their zone.
                return NextResponse.redirect(new URL('/admin', request.url));
            } else {
                return NextResponse.redirect(new URL('/site/matches', request.url));
            }
        }
    }

    return NextResponse.next();
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
