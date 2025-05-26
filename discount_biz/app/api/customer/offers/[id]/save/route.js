// app/api/customer/offers/[id]/route.js

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import supabase from "@/lib/supabase";

// Helper to track a view for analytics
async function trackOfferView(offerId, customerId = null, sessionId = null) {
  if (!offerId || (!customerId && !sessionId)) return;
  
  try {
    await supabase
      .from('customer_offer_views')
      .insert([{
        offer_id: offerId,
        customer_id: customerId,
        session_id: sessionId,
        viewed_at: new Date().toISOString()
      }]);
  } catch (error) {
    // Log but don't fail the request if tracking fails
    console.error('Error tracking offer view:', error);
  }
}

// Get authenticated user data if available
async function getAuthenticatedUser() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    return { authenticated: false };
  }
  
  // Get customer data for the authenticated user
  const { data: customerData } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', session.user.id)
    .single();
    
  if (!customerData) {
    return { authenticated: false };
  }
  
  return {
    authenticated: true,
    customerId: customerData.id,
    userId: session.user.id
  };
}

// GET - Get a single offer by ID with details
export async function GET(request, { params }) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Offer ID is required' }, 
        { status: 400 }
      );
    }
    
    // Get authenticated user data if available
    const { authenticated, customerId } = await getAuthenticatedUser();
    
    // Get guest session ID if available
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('guest-session-id')?.value;
    
    // Fetch the offer with related data
    const { data: offer, error: fetchError } = await supabase
      .from('offers')
      .select(`
        *,
        products (
          id,
          name,
          description,
          price,
          image_url,
          business_id
        ),
        businesses:products(
          businesses (
            id, 
            business_name,
            business_website,
            phone_number,
            business_address,
            avatar,
            business_description
          )
        )
      `)
      .eq('id', id)
      .single();
    
    if (fetchError) {
      return NextResponse.json(
        { error: 'Offer not found' }, 
        { status: 404 }
      );
    }
    
    // Verify the offer is active (unless explicitly requesting inactive offers)
    const showInactive = request.nextUrl.searchParams.get('showInactive') === 'true';
    const now = new Date().toISOString();
    
    if (!showInactive && (!offer.is_active || offer.expiry_date < now || offer.start_date > now)) {
      return NextResponse.json(
        { error: 'Offer is not currently active' }, 
        { status: 404 }
      );
    }
    
    // Track this view for analytics
    if (customerId || sessionId) {
      await trackOfferView(id, customerId, sessionId);
    }
    
    // Check if the user has saved this offer (if authenticated)
    let isSaved = false;
    let isClaimed = false;
    let claimDetails = null;
    
    if (authenticated && customerId) {
      // Check if offer is saved
      const { data: savedData } = await supabase
        .from('customer_saved_offers')
        .select('id')
        .eq('customer_id', customerId)
        .eq('offer_id', id)
        .single();
        
      isSaved = !!savedData;
      
      // Check if offer is claimed
      const { data: claimData } = await supabase
        .from('customer_claimed_offers')
        .select('*')
        .eq('customer_id', customerId)
        .eq('offer_id', id)
        .order('claimed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      isClaimed = !!claimData;
      claimDetails = claimData;
    }
    
    // Process business information
    const business = offer.businesses.businesses;
    delete offer.businesses;
    
    // Calculate discounted price and savings
    const originalPrice = offer.products.price;
    const discountAmount = originalPrice * (offer.discount_percentage / 100);
    const finalPrice = originalPrice - discountAmount;
    
    // Format the response
    const processedOffer = {
      ...offer,
      business,
      user: {
        authenticated,
        isSaved,
        isClaimed,
        claimDetails
      },
      calculated: {
        originalPrice,
        finalPrice,
        savings: discountAmount,
        savingsPercentage: offer.discount_percentage
      }
    };
    
    return NextResponse.json({ offer: processedOffer }, { status: 200 });
  } catch (error) {
    console.error('Error fetching offer details:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}