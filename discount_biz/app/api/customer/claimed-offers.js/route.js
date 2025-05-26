// app/api/customer/claimed-offers/route.js

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

// GET - Get all offers claimed by the customer
export async function GET(request) {
  try {
    // Get search parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status'); // 'active', 'redeemed', 'expired', or null for all
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Get authenticated customer
    const { customerId, error: authError } = await getAuthenticatedCustomer();
    
    if (authError) {
      return NextResponse.json(
        { error: authError }, 
        { status: 401 }
      );
    }
    
    // Query for claimed offers with join to offer details
    let query = supabase
      .from('customer_claimed_offers')
      .select(`
        id,
        redemption_code,
        status,
        claimed_at,
        redeemed_at,
        metadata,
        offers:offer_id (
          id,
          discount_percentage,
          discount_code,
          start_date,
          expiry_date,
          is_active,
          products (
            id,
            name,
            price,
            image_url,
            business_id
          ),
          businesses:products(
            businesses (
              id,
              business_name,
              avatar
            )
          )
        )
      `, { count: 'exact' })
      .eq('customer_id', customerId)
      .order('claimed_at', { ascending: false });
    
    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
    // Execute the query
    const { data: claimedOffers, error: fetchError, count } = await query;
    
    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message }, 
        { status: 400 }
      );
    }
    
    // Process the offers data
    const now = new Date().toISOString();
    const processedOffers = claimedOffers.map(claimedOffer => {
      const offer = claimedOffer.offers;
      
      // Skip if offer is null (might happen if an offer was deleted)
      if (!offer) {
        return {
          id: claimedOffer.id,
          redemption_code: claimedOffer.redemption_code,
          status: claimedOffer.status,
          claimed_at: claimedOffer.claimed_at,
          redeemed_at: claimedOffer.redeemed_at,
          metadata: claimedOffer.metadata,
          offer: null
        };
      }
      
      // Restructure business data
      const business = offer.businesses?.businesses;
      delete offer.businesses;
      
      // Calculate discounted price
      const originalPrice = offer.products?.price || 0;
      const discountAmount = originalPrice * (offer.discount_percentage / 100);
      const finalPrice = originalPrice - discountAmount;
      
      // Check if offer is expired based on dates
      const isExpired = offer.expiry_date < now;
      
      // Update status if needed (for automatic expiration)
      let claimStatus = claimedOffer.status;
      if (claimStatus === 'active' && isExpired) {
        claimStatus = 'expired';
        
        // We'll update the status in the database asynchronously
        // This ensures the UI shows the correct status even if the update fails
        supabase
          .from('customer_claimed_offers')
          .update({ status: 'expired' })
          .eq('id', claimedOffer.id)
          .then(result => {
            if (result.error) {
              console.error('Error updating claim status:', result.error);
            }
          });
      }
      
      return {
        id: claimedOffer.id,
        redemption_code: claimedOffer.redemption_code,
        status: claimStatus,
        claimed_at: claimedOffer.claimed_at,
        redeemed_at: claimedOffer.redeemed_at,
        metadata: claimedOffer.metadata,
        offer: {
          ...offer,
          business,
          calculated: {
            originalPrice,
            finalPrice,
            savings: discountAmount
          },
          isExpired
        }
      };
    });
    
    return NextResponse.json({
      claimedOffers: processedOffers,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching claimed offers:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}