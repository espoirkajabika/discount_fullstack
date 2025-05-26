// app/api/business/auth/signup/route.js

import { NextResponse } from 'next/server';
import supabase from "@/lib/supabase";
import supabaseAdmin from "@/lib/supabase-admin";

// Required fields: email, password, business_name
// Optional fields: phone_number, avatar, business_website, business_address, social_media_links

export async function POST(request) {
  try {
    // Parse the request body
    const { 
      email, 
      password, 
      business_name, 
      phone_number, 
      avatar, 
      business_website, 
      business_address, 
      social_media_links 
    } = await request.json();

    // Validate required fields
    if (!email || !password || !business_name) {
      return NextResponse.json(
        { error: "Email, password, and business name are required" }, 
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

    // Insert the business details into the businesses table using admin client to bypass RLS
    const { data, error: dbError } = await supabaseAdmin
      .from('businesses')
      .insert([
        {
          user_id: authData.user.id, // Link to the authenticated user
          email,
          business_name,
          phone_number: phone_number || null,
          avatar: avatar || null,
          business_website: business_website || null,
          business_address: business_address || null,
          social_media_links: social_media_links || null,
        },
      ]);

    // Rest of the function remains the same...
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
      { user: authData.user, business: data }, 
      { status: 200 }
    );
  } catch (error) {
    console.error('Business signup error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}