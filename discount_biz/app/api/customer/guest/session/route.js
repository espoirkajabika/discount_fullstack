// app/api/customer/guest/session/route.js

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import supabase from "@/lib/supabase";

export async function POST(request) {
  try {
    // Check if a guest session already exists
    const cookieStore = await cookies();
    let sessionId = cookieStore.get('guest-session-id')?.value;
    let isNewSession = false;
    
    // If no session exists, create a new one
    if (!sessionId) {
      sessionId = uuidv4();
      isNewSession = true;
    }
    
    // Get client IP and user agent if possible
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // If it's a new session, store it in the database
    if (isNewSession) {
      const { error } = await supabase
        .from('customer_sessions')
        .insert([{
          session_id: sessionId,
          ip_address: clientIp,
          user_agent: userAgent,
          created_at: new Date().toISOString(),
          last_active_at: new Date().toISOString()
        }]);
        
      if (error) {
        console.error('Error creating guest session:', error);
        // Continue even if storage fails, as we can still use cookies
      }
    } else {
      // Update the last_active_at timestamp
      const { error } = await supabase
        .from('customer_sessions')
        .update({ last_active_at: new Date().toISOString() })
        .eq('session_id', sessionId);
        
      if (error) {
        console.error('Error updating guest session:', error);
        // Continue even if update fails
      }
    }
    
    // Set cookie with the session ID
    const response = NextResponse.json({
      success: true,
      sessionId: sessionId,
      isNewSession: isNewSession
    }, { status: 200 });
    
    // Cookie options
    const cookieOptions = {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax'
    };
    
    // Set the cookie
    response.cookies.set('guest-session-id', sessionId, cookieOptions);
    
    return response;
  } catch (error) {
    console.error('Guest session error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}