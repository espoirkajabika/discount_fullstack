// app/api/test-auth/route.js

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Simple route to check cookie state and auth tokens
export async function GET() {
  try {
    // Get cookies
    const cookieStore = cookies();
    
    // Get all cookies (only names for security)
    const allCookies = cookieStore.getAll().map(c => c.name);
    
    // Check for auth tokens (just check if they exist)
    const hasAccessToken = cookieStore.has('sb-access-token');
    const hasRefreshToken = cookieStore.has('sb-refresh-token');
    
    return NextResponse.json({
      message: 'Auth check',
      cookies: {
        count: allCookies.length,
        names: allCookies,
        hasAccessToken: hasAccessToken,
        hasRefreshToken: hasRefreshToken
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error in test-auth route:', error);
    return NextResponse.json(
      { error: 'Error checking auth state' }, 
      { status: 500 }
    );
  }
}