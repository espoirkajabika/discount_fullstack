// app/api/customer/offers/[id]/claim/route.js

import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import supabase from "@/lib/supabase";
import supabaseAdmin from "@/lib/supabase-admin";

// Helper to generate a unique redemption code
function generateRedemptionCode() {
  // Generate a code with format: XXXX-XXXX-XXXX
  // Where X is alphanumeric
  const segment1 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const segment2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const segment3 = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `${segment1}-${segment2}-${segment3}`;
}

// Helper to get authenticated customer
async function getAuthenticatedCustomer() {
  // Get the current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    return { error: 'Unauthorized: No valid session' };
  }
  
  // Get customer ID for the current user
  const { data: customerData, error: customerError } = await supabase
    .from('customers')
    .select('id, first_name, last_name, email')
    .eq('user_id', session.user.id)
    .single();
    
  if (customerError || !customerData) {
    return { error: 'Customer profile not found' };
  }
  
  return { 
    customerId: customerData.id, 
    userId: session.user.id,
    customerData
  };
}

// POST - Claim an offer
export async function POST(request, { params }) {
  try {
    // Extract the ID from params directly through destructuring
    // In App Router, we should ensure the ID exists
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Offer ID is required' }, 
        { status: 400 }
      );
    }
    
    // Get authenticated customer
    const { customerId, userId, customerData, error: authError } = await getAuthenticatedCustomer();
    
    if (authError) {
      return NextResponse.json(
        { error: authError }, 
        { status: 401 }
      );
    }
    
    // Check if the offer exists and is valid
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select(`
        id, 
        is_active, 
        start_date, 
        expiry_date, 
        max_claims, 
        current_claims,
        products (
          id,
          name,
          business_id
        )
      `)
      .eq('id', id)
      .single();
      
    if (offerError) {
      return NextResponse.json(
        { error: 'Offer not found' }, 
        { status: 404 }
      );
    }
    
    // Check if offer is currently active
    const now = new Date().toISOString();
    if (!offer.is_active || offer.expiry_date < now || offer.start_date > now) {
      return NextResponse.json(
        { error: 'This offer is not currently active' }, 
        { status: 400 }
      );
    }
    
    // Check if customer has already claimed this offer
    const { data: existingClaim, error: claimError } = await supabase
      .from('customer_claimed_offers')
      .select('id, status, redemption_code')
      .eq('customer_id', customerId)
      .eq('offer_id', id)
      .maybeSingle();
      
    if (existingClaim) {
      return NextResponse.json({
        claimed: true,
        message: 'You have already claimed this offer',
        claimData: existingClaim
      }, { status: 200 });
    }
    
    // Check if maximum claims limit has been reached
    if (offer.max_claims !== null && offer.current_claims >= offer.max_claims) {
      return NextResponse.json(
        { error: 'This offer has reached its maximum number of claims' }, 
        { status: 400 }
      );
    }
    
    // Generate a unique redemption code
    const redemptionCode = generateRedemptionCode();
    
    // Create the claim record
    const { data: claimData, error: insertError } = await supabase
      .from('customer_claimed_offers')
      .insert([{
        customer_id: customerId,
        offer_id: id,
        redemption_code: redemptionCode,
        status: 'active',
        claimed_at: now,
        metadata: {
          customer_name: `${customerData.first_name || ''} ${customerData.last_name || ''}`.trim() || null,
          customer_email: customerData.email
        }
      }])
      .select()
      .single();
      
    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to claim offer: ' + insertError.message }, 
        { status: 400 }
      );
    }
    
    // Increment the current claims count for the offer
    const { error: updateError } = await supabaseAdmin
      .from('offers')
      .update({ 
        current_claims: offer.current_claims + 1 
      })
      .eq('id', id);
      
    if (updateError) {
      console.error('Error updating offer claims count:', updateError);
      // Don't fail the request, but log the error
    }
    
    return NextResponse.json({
      success: true,
      message: 'Offer claimed successfully',
      claimData
    }, { status: 200 });
  } catch (error) {
    console.error('Error claiming offer:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}