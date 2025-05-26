// app/api/customer/businesses/[id]/route.js

import { NextResponse } from 'next/server';
import supabase from "@/lib/supabase";

// GET - Get a single business by ID with its active offers
export async function GET(request, { params }) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Business ID is required' }, 
        { status: 400 }
      );
    }
    
    // Get the business details
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select(`
        id,
        business_name,
        business_website,
        business_address,
        business_description,
        phone_number,
        avatar,
        social_media_links,
        business_hours
      `)
      .eq('id', id)
      .single();
      
    if (businessError) {
      return NextResponse.json(
        { error: 'Business not found' }, 
        { status: 404 }
      );
    }
    
    // Current date for filtering active offers
    const now = new Date().toISOString();
    
    // Get search parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const showExpired = searchParams.get('showExpired') === 'true';
    const sortBy = searchParams.get('sortBy') || 'discount_percentage';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Query for active offers from this business
    let offersQuery = supabase
      .from('offers')
      .select(`
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
          image_url
        )
      `, { count: 'exact' })
      .eq('is_active', true)
      .in('product_id', 
        supabase
          .from('products')
          .select('id')
          .eq('business_id', id)
      )
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);
    
    // Add time constraints unless showExpired is true
    if (!showExpired) {
      offersQuery = offersQuery.gte('expiry_date', now);
    }
    
    // Filter by start date (only show offers that have started)
    offersQuery = offersQuery.lte('start_date', now);
    
    // Execute the query
    const { data: offers, error: offersError, count } = await offersQuery;
    
    if (offersError) {
      console.error('Error fetching offers:', offersError);
      return NextResponse.json(
        { error: 'Failed to fetch offers' }, 
        { status: 400 }
      );
    }
    
    // Format offer data with calculated prices
    const processedOffers = offers.map(offer => {
      const originalPrice = offer.products?.price || 0;
      const discountAmount = originalPrice * (offer.discount_percentage / 100);
      const finalPrice = originalPrice - discountAmount;
      
      return {
        ...offer,
        calculated: {
          originalPrice,
          finalPrice,
          savings: discountAmount
        }
      };
    });
    
    // Get total offers count
    const { count: totalOffersCount } = await supabase
      .from('offers')
      .select('id', { count: 'exact' })
      .in('product_id', 
        supabase
          .from('products')
          .select('id')
          .eq('business_id', id)
      );
    
    // Get total active offers count
    const { count: activeOffersCount } = await supabase
      .from('offers')
      .select('id', { count: 'exact' })
      .eq('is_active', true)
      .gte('expiry_date', now)
      .lte('start_date', now)
      .in('product_id', 
        supabase
          .from('products')
          .select('id')
          .eq('business_id', id)
      );
    
    // Format the response
    const response = {
      business: {
        ...business,
        stats: {
          total_offers: totalOffersCount || 0,
          active_offers: activeOffersCount || 0
        }
      },
      offers: processedOffers,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    };
    
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching business details:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}