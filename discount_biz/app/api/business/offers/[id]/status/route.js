// app/api/business/offers/[id]/status/route.js

import { NextResponse } from 'next/server';
import supabase from "@/lib/supabase";
import supabaseAdmin from "@/lib/supabase-admin";

// Helper function to verify business ownership of an offer
async function verifyOfferOwnership(offerId, userId) {
  // Get user's business ID
  const { data: businessData, error: businessError } = await supabaseAdmin
    .from('businesses')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (businessError || !businessData) {
    return { error: 'Business profile not found', status: 404 };
  }

  // Check if the offer belongs to the business
  const { data: offer, error: offerError } = await supabase
    .from('offers')
    .select('*')
    .eq('id', offerId)
    .eq('business_id', businessData.id)
    .single();

  if (offerError) {
    return { error: 'Offer not found', status: 404 };
  }

  return { businessId: businessData.id, offer };
}

// PATCH - Toggle offer status (activate/deactivate)
export async function PATCH(request) {
  try {
    // Extract the offer ID from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    // URL format is /api/business/offers/{id}/status
    const offerId = pathParts[pathParts.length - 2];
    
    if (!offerId) {
      return NextResponse.json({ error: 'Offer ID is required' }, { status: 400 });
    }

    // Get the current session to verify authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Verify ownership and get business ID and current offer details
    const { error, status, businessId, offer: existingOffer } = await verifyOfferOwnership(offerId, session.user.id);
    
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    // Parse the request body
    const { is_active } = await request.json();

    if (is_active === undefined) {
      return NextResponse.json(
        { error: 'is_active field is required' }, 
        { status: 400 }
      );
    }

    // If trying to activate, check if the offer can be activated (not expired)
    if (is_active === true) {
      const now = new Date();
      const expiryDate = new Date(existingOffer.expiry_date);
      
      if (expiryDate < now) {
        return NextResponse.json(
          { error: 'Cannot activate an expired offer' }, 
          { status: 400 }
        );
      }
    }

    // Update the offer status
    const { data: updatedOffer, error: updateError } = await supabase
      .from('offers')
      .update({ is_active })
      .eq('id', offerId)
      .eq('business_id', businessId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message }, 
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      offer: updatedOffer,
      message: is_active ? 'Offer activated successfully' : 'Offer deactivated successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating offer status:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}