// app/api/business/settings/profile/route.js

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import supabase from "@/lib/supabase";
import supabaseAdmin from "@/lib/supabase-admin";

// PATCH - Update business profile information
export async function PATCH(request) {
  try {
    // Get the cookies for authentication
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;
    const refreshToken = cookieStore.get('sb-refresh-token')?.value;
    
    let session;
    
    // Attempt to get session with tokens if available
    if (accessToken && refreshToken) {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
      
      if (!error) {
        session = data.session;
      }
    }
    
    // If that failed, try getting the session directly
    if (!session) {
      const { data, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !data.session) {
        console.error('Authentication error:', sessionError || 'No session found');
        return NextResponse.json(
          { error: 'Unauthorized: Invalid session' }, 
          { status: 401 }
        );
      }
      
      session = data.session;
    }
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid session' }, 
        { status: 401 }
      );
    }

    // Get user's business ID
    const { data: businessData, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (businessError || !businessData) {
      return NextResponse.json(
        { error: 'Business profile not found' }, 
        { status: 404 }
      );
    }

    // Parse the request body
    const updates = await request.json();
    
    // Fields we allow to be updated
    const {
      business_name,
      email,
      phone_number,
      business_website,
      business_address,
      business_description,
      social_media_links,
      business_hours,
      avatar
    } = updates;

    // Validate business name
    if (!business_name || business_name.trim() === '') {
      return NextResponse.json(
        { error: 'Business name is required' }, 
        { status: 400 }
      );
    }

    // Create an object with only the fields to update
    const updateData = {
      business_name,
      phone_number: phone_number || null,
      business_website: business_website || null,
      business_address: business_address || null,
      business_description: business_description || null,
      social_media_links: social_media_links || null,
      business_hours: business_hours || null,
      avatar: avatar || null
    };

    // Only update email if different from the current one and valid
    if (email && email !== businessData.email) {
      if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return NextResponse.json(
          { error: 'Invalid email format' }, 
          { status: 400 }
        );
      }
      updateData.email = email;
    }

    // Update the business profile
    const { data: updatedBusiness, error: updateError } = await supabaseAdmin
      .from('businesses')
      .update(updateData)
      .eq('id', businessData.id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message }, 
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Business profile updated successfully',
      business: updatedBusiness
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating business profile:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}