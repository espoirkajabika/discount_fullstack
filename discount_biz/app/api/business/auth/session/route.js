// app/api/business/auth/session/route.js

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
    
    // Debug log
    console.log('Access token exists:', !!accessToken, 'Refresh token exists:', !!refreshToken);
    
    // No cookies present - user is not authenticated
    if (!accessToken || !refreshToken) {
      console.log('No auth tokens found, returning 401');
      return NextResponse.json(
        { authenticated: false }, 
        { status: 401 }
      );
    }
    
    // Try to get or refresh the session with tokens
    console.log('Attempting to set session with tokens');
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
    
    console.log('Session valid, fetching business data');
    
    // Session is valid, fetch associated business data
    const { data: businessData, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('user_id', data.session.user.id)
      .single();

    if (businessError && businessError.code !== 'PGRST116') {
      console.error('Error fetching business data:', businessError);
      return NextResponse.json(
        { error: 'Error retrieving business profile' }, 
        { status: 500 }
      );
    }

    // Check if business account is suspended or inactive
    if (businessData && businessData.subscription_status === 'suspended') {
      return NextResponse.json({
        authenticated: true,
        accountStatus: 'suspended',
        user: data.session.user,
        business: businessData
      }, { status: 403 });
    }

    console.log('Auth successful, returning user data');
    
    // Set new tokens if they were refreshed
    const response = NextResponse.json({
      authenticated: true,
      user: data.session.user,
      business: businessData || null
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