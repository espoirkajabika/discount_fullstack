// app/api/business/auth/signin/route.js

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import supabase from "@/lib/supabase";
import supabaseAdmin from "@/lib/supabase-admin";

export async function POST(request) {
  try {
    // Parse the request body
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' }, 
        { status: 400 }
      );
    }

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message }, 
        { status: 400 }
      );
    }

    // Fetch the associated business data
    const { data: businessData, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    if (businessError && businessError.code !== 'PGRST116') { // PGRST116 is "Results contain 0 rows"
      console.error('Error fetching business data:', businessError);
      return NextResponse.json(
        { error: 'Error retrieving business profile' }, 
        { status: 500 }
      );
    }

    // Check if business account is suspended or inactive
    if (businessData && businessData.subscription_status === 'suspended') {
      return NextResponse.json({
        error: 'This business account has been suspended. Please contact support.',
        user: authData.user,
        business: businessData
      }, { status: 403 });
    }

    // Create a response with the user data
    const response = NextResponse.json({
      user: authData.user,
      session: authData.session,
      business: businessData || null
    }, { status: 200 });

    // Set auth cookies with secure settings
    const cookieOptions = {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax'  // Use 'lax' for better compatibility
    };

    // Set cookies in the response
    response.cookies.set('sb-access-token', authData.session.access_token, cookieOptions);
    response.cookies.set('sb-refresh-token', authData.session.refresh_token, cookieOptions);

    return response;
  } catch (error) {
    console.error('Business signin error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}