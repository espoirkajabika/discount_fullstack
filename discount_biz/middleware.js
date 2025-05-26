import { NextResponse } from 'next/server';

export function middleware(request) {
  // Get cookies from the request
  const { cookies } = request;
  const hasAuthCookies = cookies.has('sb-access-token') && cookies.has('sb-refresh-token');
  
  // Check if the route is a protected route
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/business') && 
                          !request.nextUrl.pathname.startsWith('/business/auth');
  
  // If it's a protected route and no auth cookies, redirect to login
  if (isProtectedRoute && !hasAuthCookies) {
    return NextResponse.redirect(new URL('/business/auth/login', request.url));
  }
  
  // Special handling for business root route - ensure auth
  if (request.nextUrl.pathname === '/business' && !hasAuthCookies) {
    return NextResponse.redirect(new URL('/business/auth/login', request.url));
  }
  
  // Handle already logged in users trying to access auth pages
  const isAuthRoute = request.nextUrl.pathname.startsWith('/business/auth/');
  if (isAuthRoute && hasAuthCookies) {
    // Don't redirect from logout page
    if (!request.nextUrl.pathname.includes('/business/auth/signout')) {
      // Redirect to dashboard if already logged in
      return NextResponse.redirect(new URL('/business/dashboard', request.url));
    }
  }
  
  return NextResponse.next();
}

// Define which paths this middleware will run on
export const config = {
  matcher: [
    '/business/:path*',
    // Exclude public assets and API routes
    '/((?!api|_next/static|_next/image|images|favicon.ico).*)',
  ],
};