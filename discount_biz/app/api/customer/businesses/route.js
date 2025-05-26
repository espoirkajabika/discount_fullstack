// app/api/customer/businesses/route.js

import { NextResponse } from 'next/server';
import supabase from "@/lib/supabase";

// GET - Get businesses with active offers
export async function GET(request) {
  try {
    // Get search parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'business_name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Current date for filtering active offers
    const now = new Date().toISOString();
    
    // First, get business IDs that have active offers
    let businessQuery = supabase
      .from('businesses')
      .select(`
        id,
        business_name,
        business_website,
        business_address,
        business_description,
        avatar,
        count_offers:products!inner(
          count(offers!inner(id))
        )
      `, { count: 'exact' })
      .filter('products.offers.is_active', 'eq', true)
      .filter('products.offers.start_date', 'lte', now)
      .filter('products.offers.expiry_date', 'gte', now)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);
    
    // Add search filter if provided
    if (search) {
      businessQuery = businessQuery.ilike('business_name', `%${search}%`);
    }
    
    // Execute the query
    const { data: businesses, error: fetchError, count } = await businessQuery;
    
    if (fetchError) {
      console.error('Error fetching businesses:', fetchError);
      return NextResponse.json(
        { error: fetchError.message }, 
        { status: 400 }
      );
    }
    
    // For each business, get the count of active offers
    const businessesWithOfferCounts = await Promise.all(
      businesses.map(async (business) => {
        // Get count of active offers
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
              .eq('business_id', business.id)
          );
          
        // Get a sample of offers (latest 3) for preview
        const { data: recentOffers } = await supabase
          .from('offers')
          .select(`
            id,
            discount_percentage,
            products (
              name,
              price
            )
          `)
          .eq('is_active', true)
          .gte('expiry_date', now)
          .lte('start_date', now)
          .in('product_id', 
            supabase
              .from('products')
              .select('id')
              .eq('business_id', business.id)
          )
          .order('created_at', { ascending: false })
          .limit(3);
        
        // Process the business data
        return {
          ...business,
          active_offers_count: activeOffersCount || 0,
          recent_offers: recentOffers?.map(offer => ({
            id: offer.id,
            discount_percentage: offer.discount_percentage,
            product_name: offer.products?.name
          })) || []
        };
      })
    );
    
    return NextResponse.json({
      businesses: businessesWithOfferCounts,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}