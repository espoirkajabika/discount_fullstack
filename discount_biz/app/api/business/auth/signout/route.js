// app/api/business/auth/signout/route.js

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import supabase from "@/lib/supabase";

export async function POST(request) {
  try {
    // Sign out from Supabase Auth
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error signing out:', error);
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      );
    }

    // Create a response
    const response = NextResponse.json(
      { success: true, message: 'Successfully signed out' }, 
      { status: 200 }
    );

    // Clear auth cookies - crucial for properly ending the session
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');
    
    // Clear any other possible auth-related cookies
    response.cookies.delete('supabase-auth-token');

    return response;
  } catch (error) {
    console.error('Business signout error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}