// app/api/business/offers/[id]/claim/route.js

import { NextResponse } from 'next/server';
import supabase from "@/lib/supabase";
import supabaseAdmin from "@/lib/supabase-admin";

// POST - Record a claim on an offer
export async function POST(request) {
  try {
    // Extract the offer ID from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    // URL format is /api/business/offers/{id}/claim
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

    // Get the offer details
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select('*')
      .eq('id', offerId)
      .eq('business_id', businessData.id)
      .single();

    if (offerError) {
      return NextResponse.json(
        { error: 'Offer not found' }, 
        { status: 404 }
      );
    }

    // Check if offer is active
    if (!offer.is_active) {
      return NextResponse.json(
        { error: 'This offer is not currently active' }, 
        { status: 400 }
      );
    }

    // Check if offer is within valid date range
    const now = new Date();
    const startDate = new Date(offer.start_date);
    const expiryDate = new Date(offer.expiry_date);
    
    if (now < startDate || now > expiryDate) {
      return NextResponse.json(
        { error: 'This offer is not currently valid' }, 
        { status: 400 }
      );
    }

    // Check if maximum claims limit has been reached
    if (offer.max_claims !== null && offer.current_claims >= offer.max_claims) {
      return NextResponse.json(
        { error: 'This offer has reached its maximum number of claims' }, 
        { status: 400 }
      );
    }

    // Increment the claim count
    const { data: updatedOffer, error: updateError } = await supabase
      .from('offers')
      .update({ 
        current_claims: offer.current_claims + 1 
      })
      .eq('id', offerId)
      .eq('business_id', businessData.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message }, 
        { status: 400 }
      );
    }

    // Optional: Record the claim details in a separate table
    // This would be useful for tracking who claimed the offer, when, etc.
    // Implementation depends on your specific requirements

    return NextResponse.json({
      success: true,
      message: 'Offer claimed successfully',
      offer: updatedOffer
    }, { status: 200 });
  } catch (error) {
    console.error('Error claiming offer:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}