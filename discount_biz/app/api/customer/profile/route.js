// app/api/customer/profile/route.js

import { NextResponse } from 'next/server';
import supabase from "@/lib/supabase";

// Helper to get authenticated user ID
async function getAuthenticatedUserId() {
  try {
    console.log("Getting authenticated user session");
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Session error:", sessionError);
      return { error: 'Unauthorized: Session error' };
    }
    
    if (!session || !session.user) {
      console.log("No valid session or user found");
      return { error: 'Unauthorized: No valid session' };
    }
    
    console.log("Session found for user:", session.user.id);
    return { userId: session.user.id };
  } catch (error) {
    console.error("Unexpected error in getAuthenticatedUserId:", error);
    return { error: 'Unauthorized: Authentication error' };
  }
}

// GET - Get the customer's profile
export async function GET() {
  try {
    console.log("Profile API called");
    
    // Get authenticated user ID
    const { userId, error: authError } = await getAuthenticatedUserId();
    
    if (authError) {
      console.log("Auth error in profile API:", authError);
      return NextResponse.json(
        { error: authError }, 
        { status: 401 }
      );
    }
    
    // Get the customer's profile
    const { data: profile, error: profileError } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (profileError) {
      return NextResponse.json(
        { error: 'Customer profile not found' }, 
        { status: 404 }
      );
    }
    
    // Get counts for saved and claimed offers
    const [savedResult, claimedResult, activeClaimsResult] = await Promise.all([
      // Count saved offers
      supabase
        .from('customer_saved_offers')
        .select('id', { count: 'exact' })
        .eq('customer_id', profile.id),
        
      // Count total claimed offers
      supabase
        .from('customer_claimed_offers')
        .select('id', { count: 'exact' })
        .eq('customer_id', profile.id),
        
      // Count active claimed offers
      supabase
        .from('customer_claimed_offers')
        .select('id', { count: 'exact' })
        .eq('customer_id', profile.id)
        .eq('status', 'active')
    ]);
    
    // Add stats to the profile
    const profileWithStats = {
      ...profile,
      stats: {
        savedOffers: savedResult.count || 0,
        claimedOffers: claimedResult.count || 0,
        activeOffers: activeClaimsResult.count || 0
      }
    };
    
    return NextResponse.json({ profile: profileWithStats }, { status: 200 });
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}

// PATCH - Update the customer's profile
export async function PATCH(request) {
  try {
    // Get authenticated user ID
    const { userId, error: authError } = await getAuthenticatedUserId();
    
    if (authError) {
      return NextResponse.json(
        { error: authError }, 
        { status: 401 }
      );
    }
    
    // Parse the request body
    const updates = await request.json();
    
    // Extract allowed fields to update
    const {
      first_name,
      last_name,
      phone_number,
      avatar,
      notification_preferences
    } = updates;
    
    // Create an object with only the fields to update
    const updateData = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (phone_number !== undefined) updateData.phone_number = phone_number;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (notification_preferences !== undefined) updateData.notification_preferences = notification_preferences;
    
    // Update the customer's profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('customers')
      .update(updateData)
      .eq('user_id', userId)
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
      message: 'Profile updated successfully',
      profile: updatedProfile
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating customer profile:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}