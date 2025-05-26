// app/api/customer/claimed-offers/[id]/route.js

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

// GET - Get a single claimed offer with full details
export async function GET(request, { params }) {
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
    
    // Get the claimed offer with related data
    const { data: claimedOffer, error: fetchError } = await supabase
      .from('customer_claimed_offers')
      .select(`
        *,
        offers:offer_id (
          *,
          products (
            *
          ),
          businesses:products(
            businesses (
              id,
              business_name,
              business_website,
              phone_number,
              business_address,
              avatar,
              business_description,
              business_hours
            )
          )
        )
      `)
      .eq('id', id)
      .eq('customer_id', customerId)
      .single();
      
    if (fetchError) {
      return NextResponse.json(
        { error: 'Claimed offer not found' }, 
        { status: 404 }
      );
    }
    
    // Process the data
    const offer = claimedOffer.offers;
    const business = offer?.businesses?.businesses;
    delete offer?.businesses;
    
    // Calculate discounted price
    const originalPrice = offer?.products?.price || 0;
    const discountAmount = originalPrice * (offer?.discount_percentage / 100);
    const finalPrice = originalPrice - discountAmount;
    
    // Check if offer is expired based on dates
    const now = new Date().toISOString();
    const isExpired = offer?.expiry_date < now;
    
    // Update status if needed (for automatic expiration)
    let claimStatus = claimedOffer.status;
    if (claimStatus === 'active' && isExpired) {
      claimStatus = 'expired';
      
      // Update the status in the database
      await supabase
        .from('customer_claimed_offers')
        .update({ status: 'expired' })
        .eq('id', claimedOffer.id);
    }
    
    // Format the response
    const formattedClaim = {
      ...claimedOffer,
      status: claimStatus,
      offer: {
        ...offer,
        business,
        product: offer?.products,
        calculated: {
          originalPrice,
          finalPrice,
          savings: discountAmount,
          savingsPercentage: offer?.discount_percentage
        },
        isExpired
      }
    };
    
    // Remove redundant data
    delete formattedClaim.offer_id;
    delete formattedClaim.offers;
    delete formattedClaim.offer.products;
    
    return NextResponse.json({ claimedOffer: formattedClaim }, { status: 200 });
  } catch (error) {
    console.error('Error fetching claimed offer details:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}