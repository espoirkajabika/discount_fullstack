// app/api/business/auth/reset-password/route.js

import { NextResponse } from 'next/server';
import supabase from "@/lib/supabase";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' }, 
        { status: 400 }
      );
    }

    // Send password reset email via Supabase Auth
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password/update`,
    });

    if (error) {
      console.error('Error sending password reset:', error);
      return NextResponse.json(
        { error: error.message }, 
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}

// Route for updating password after reset
export async function PUT(request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'New password is required' }, 
        { status: 400 }
      );
    }

    // Update the user's password
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      console.error('Error updating password:', error);
      return NextResponse.json(
        { error: error.message }, 
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Password update error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}