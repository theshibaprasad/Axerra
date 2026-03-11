import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;

    const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');
    const isManagerDashboardRoute = request.nextUrl.pathname.startsWith('/manager-dashboard');
    const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register');

    // 1. Not logged in -> Redirect to login for protected routes
    if ((isDashboardRoute || isManagerDashboardRoute) && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (token) {
        try {
            // Verify JWT using jose (Edge compatible)
            const secret = new TextEncoder().encode(process.env.JWT_SECRET);
            const { payload } = await jwtVerify(token, secret);
            const role = payload.role as string;

            // 2. Prevent role cross-contamination
            if (isDashboardRoute && role === 'manager') {
                return NextResponse.redirect(new URL('/manager-dashboard', request.url));
            }

            if (isManagerDashboardRoute && role === 'company') {
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }

            // 3. Logged in user visiting auth pages -> Redirect to their respective dashboards
            if (isAuthRoute) {
                if (role === 'manager') {
                    return NextResponse.redirect(new URL('/manager-dashboard', request.url));
                } else {
                    return NextResponse.redirect(new URL('/dashboard', request.url));
                }
            }
        } catch (error) {
            // Invalid token - clear cookie and redirect to login
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('token');
            return response;
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/manager-dashboard/:path*', '/login', '/register'],
};
