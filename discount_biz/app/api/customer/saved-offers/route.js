// app/api/customer/saved-offers/route.js

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

// GET - Get all offers saved by the customer
export async function GET(request) {
  try {
    // Get search parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const showExpired = searchParams.get('showExpired') === 'true';
    
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
    
    // Query for saved offers with join to offer details
    let query = supabase
      .from('customer_saved_offers')
      .select(`
        id,
        created_at,
        offers:offer_id (
          id,
          discount_percentage,
          discount_code,
          start_date,
          expiry_date,
          is_active,
          max_claims,
          current_claims,
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
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Execute the query
    const { data: savedOffers, error: fetchError, count } = await query;
    
    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message }, 
        { status: 400 }
      );
    }
    
    // Process the offers data
    const now = new Date().toISOString();
    const processedOffers = savedOffers.map(savedOffer => {
      const offer = savedOffer.offers;
      
      // Skip if offer is null (might happen if an offer was deleted)
      if (!offer) {
        return {
          id: savedOffer.id,
          saved_at: savedOffer.created_at,
          offer: null,
          status: 'unavailable'
        };
      }
      
      // Restructure business data
      const business = offer.businesses?.businesses;
      delete offer.businesses;
      
      // Calculate discounted price
      const originalPrice = offer.products?.price || 0;
      const discountAmount = originalPrice * (offer.discount_percentage / 100);
      const finalPrice = originalPrice - discountAmount;
      
      // Determine status
      let status = 'active';
      if (!offer.is_active) {
        status = 'inactive';
      } else if (offer.expiry_date < now) {
        status = 'expired';
      } else if (offer.start_date > now) {
        status = 'upcoming';
      }
      
      return {
        id: savedOffer.id,
        saved_at: savedOffer.created_at,
        offer: {
          ...offer,
          business,
          calculated: {
            originalPrice,
            finalPrice,
            savings: discountAmount
          }
        },
        status
      };
    });
    
    // Filter expired offers if requested
    const filteredOffers = showExpired 
      ? processedOffers 
      : processedOffers.filter(item => item.status !== 'expired' && item.offer !== null);
    
    return NextResponse.json({
      savedOffers: filteredOffers,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching saved offers:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}