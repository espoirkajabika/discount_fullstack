// app/api/customer/offers/route.js

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import supabase from "@/lib/supabase";

// Helper to track a view for analytics
async function trackOfferView(offerId, userId = null, sessionId = null) {
  if (!offerId || (!userId && !sessionId)) return;
  
  try {
    await supabase
      .from('customer_offer_views')
      .insert([{
        offer_id: offerId,
        customer_id: userId,
        session_id: sessionId,
        viewed_at: new Date().toISOString()
      }]);
  } catch (error) {
    // Log but don't fail the request if tracking fails
    console.error('Error tracking offer view:', error);
  }
}

// Get authenticated session data if available
async function getSessionData() {
  const cookieStore = await cookies();
  const guestSessionId = cookieStore.get('guest-session-id')?.value;
  
  // Attempt to get authenticated session
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    // Return guest session data if available
    return { 
      isAuthenticated: false,
      userId: null,
      sessionId: guestSessionId
    };
  }
  
  // Get customer ID for the authenticated user
  const { data: customerData } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', session.user.id)
    .single();
    
  return {
    isAuthenticated: true,
    userId: customerData?.id || null,
    sessionId: guestSessionId
  };
}

// GET - Get all available offers with filtering and sorting
export async function GET(request) {
  try {
    // Get search parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const businessId = searchParams.get('businessId');
    const sortBy = searchParams.get('sortBy') || 'discount_percentage';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const showExpired = searchParams.get('showExpired') === 'true';
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Build query to get active offers with their product data
    let query = supabase
      .from('offers')
      .select(`
        *,
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
            business_website,
            avatar
          )
        )
      `, { count: 'exact' })
      .eq('is_active', true)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);
    
    // Add time constraints unless showExpired is true
    const now = new Date().toISOString();
    if (!showExpired) {
      query = query.gte('expiry_date', now);
    }
    
    // Filter by start date (only show offers that have started)
    query = query.lte('start_date', now);
    
    // Add search filter if provided
    if (search) {
      query = query.textSearch('products.name', search, {
        config: 'english'
      });
    }
    
    // Add business ID filter if provided
    if (businessId) {
      query = query.eq('products.business_id', businessId);
    }
    
    // Execute query
    const { data: offers, error: fetchError, count } = await query;
    
    if (fetchError) {
      console.error('Error fetching offers:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch offers: ' + fetchError.message }, 
        { status: 400 }
      );
    }
    
    // Get session data for tracking
    const { isAuthenticated, userId, sessionId } = await getSessionData();
    
    // Process the offers data
    const processedOffers = offers.map(offer => {
      // Restructure business data
      const business = offer.businesses.businesses;
      delete offer.businesses;
      
      // Calculate discounted price
      const originalPrice = offer.products.price;
      const discountAmount = originalPrice * (offer.discount_percentage / 100);
      const finalPrice = originalPrice - discountAmount;
      
      // Add business name to offer
      return {
        ...offer,
        business: business,
        calculated: {
          originalPrice,
          finalPrice,
          savings: discountAmount
        }
      };
    });
    
    return NextResponse.json({
      offers: processedOffers,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      },
      filters: {
        search,
        category,
        businessId,
        sortBy,
        sortOrder
      },
      user: {
        isAuthenticated
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching offers:', error);
    return NextResponse.json(
      { error: 'Internal Server Error: ' + error.message }, 
      { status: 500 }
    );
  }
}