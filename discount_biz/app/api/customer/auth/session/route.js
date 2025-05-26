// app/api/customer/auth/session/route.js

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import supabase from "@/lib/supabase";
import supabaseAdmin from "@/lib/supabase-admin";

export async function GET() {
  try {
    // Use await when calling cookies()
    const cookieStore = await cookies();
    
    // Now we can safely access the cookies
    const accessToken = cookieStore.get('sb-access-token')?.value || null;
    const refreshToken = cookieStore.get('sb-refresh-token')?.value || null;
    
    // No cookies present - user is not authenticated
    if (!accessToken || !refreshToken) {
      // Check for session ID for guest tracking
      const sessionId = cookieStore.get('guest-session-id')?.value;
      
      // Return guest session info if available
      if (sessionId) {
        return NextResponse.json({
          authenticated: false,
          isGuest: true,
          sessionId: sessionId
        }, { status: 200 });
      }
      
      return NextResponse.json(
        { authenticated: false, isGuest: false }, 
        { status: 200 }
      );
    }
    
    // Try to get or refresh the session with tokens
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    
    if (error) {
      console.error('Session error:', error);
      
      // Clear invalid cookies
      const response = NextResponse.json(
        { authenticated: false, error: 'Invalid session' }, 
        { status: 401 }
      );
      
      response.cookies.delete('sb-access-token');
      response.cookies.delete('sb-refresh-token');
      
      return response;
    }
    
    // Session is valid, fetch associated customer data
    const { data: customerData, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('user_id', data.session.user.id)
      .single();

    if (customerError && customerError.code !== 'PGRST116') {
      console.error('Error fetching customer data:', customerError);
      return NextResponse.json(
        { error: 'Error retrieving customer profile' }, 
        { status: 500 }
      );
    }

    // Set new tokens if they were refreshed
    const response = NextResponse.json({
      authenticated: true,
      isGuest: false,
      user: data.session.user,
      customer: customerData || null
    }, { status: 200 });
    
    // Cookie options
    const cookieOptions = {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax'
    };
    
    // Update cookies with new tokens if they've changed
    if (data.session.access_token !== accessToken) {
      response.cookies.set('sb-access-token', data.session.access_token, cookieOptions);
    }
    
    if (data.session.refresh_token !== refreshToken) {
      response.cookies.set('sb-refresh-token', data.session.refresh_token, cookieOptions);
    }
    
    return response;
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}