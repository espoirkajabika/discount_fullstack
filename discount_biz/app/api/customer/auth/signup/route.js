// app/api/customer/auth/signup/route.js

import { NextResponse } from 'next/server';
import supabase from "@/lib/supabase";
import supabaseAdmin from "@/lib/supabase-admin";

export async function POST(request) {
  try {
    // Parse the request body
    const { 
      email, 
      password, 
      first_name, 
      last_name, 
      phone_number
    } = await request.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" }, 
        { status: 400 }
      );
    }

    // Create a new user in the auth schema
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message }, 
        { status: 400 }
      );
    }

    // Insert the customer details into the customers table using admin client to bypass RLS
    const { data, error: dbError } = await supabaseAdmin
      .from('customers')
      .insert([
        {
          user_id: authData.user.id, // Link to the authenticated user
          email,
          first_name: first_name || null,
          last_name: last_name || null,
          phone_number: phone_number || null,
          notification_preferences: { email: true, push: false }
        },
      ]);

    if (dbError) {
      // If database insertion fails, we should clean up the created auth user
      // to avoid orphaned auth accounts
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      return NextResponse.json(
        { error: dbError.message }, 
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        user: authData.user, 
        customer: {
          first_name,
          last_name,
          email,
          phone_number
        } 
      }, 
      { status: 200 }
    );
  } catch (error) {
    console.error('Customer signup error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}