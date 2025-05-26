// app/api/customer/claimed-offers/[id]/redeem/route.js

import { NextResponse } from 'next/server';
import supabase from "@/lib/supabase";

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
    .select('id')
    .eq('user_id', session.user.id)
    .single();
    
  if (customerError || !customerData) {
    return { error: 'Customer profile not found' };
  }
  
  return { customerId: customerData.id, userId: session.user.id };
}

// POST - Mark an offer as redeemed
export async function POST(request, { params }) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Claimed offer ID is required' }, 
        { status: 400 }
      );
    }
    
    // Get authenticated customer
    const { customerId, error: authError } = await getAuthenticatedCustomer();
    
    if (authError) {
      return NextResponse.json(
        { error: authError }, 
        { status: 401 }
      );
    }
    
    // Get the claimed offer
    const { data: claimedOffer, error: fetchError } = await supabase
      .from('customer_claimed_offers')
      .select('*')
      .eq('id', id)
      .eq('customer_id', customerId)
      .single();
      
    if (fetchError) {
      return NextResponse.json(
        { error: 'Claimed offer not found' }, 
        { status: 404 }
      );
    }
    
    // Verify the offer is active and can be redeemed
    if (claimedOffer.status !== 'active') {
      return NextResponse.json(
        { 
          error: `This offer cannot be redeemed because it is ${claimedOffer.status}`,
          status: claimedOffer.status
        }, 
        { status: 400 }
      );
    }
    
    // Update the offer status to redeemed
    const { data: updatedOffer, error: updateError } = await supabase
      .from('customer_claimed_offers')
      .update({
        status: 'redeemed',
        redeemed_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('customer_id', customerId)
      .select()
      .single();
      
    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update offer status: ' + updateError.message }, 
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Offer redeemed successfully',
      redeemedOffer: updatedOffer
    }, { status: 200 });
  } catch (error) {
    console.error('Error redeeming offer:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}