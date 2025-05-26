// app/api/business/offers/analytics/route.js

import { NextResponse } from 'next/server';
import supabase from "@/lib/supabase";
import supabaseAdmin from "@/lib/supabase-admin";

// GET - Get analytics for offers
export async function GET(request) {
  try {
    // Get the current session to verify authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('Unauthorized access to offers analytics:', sessionError?.message || 'No session');
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
      console.error('Business profile not found:', businessError?.message);
      return NextResponse.json(
        { error: 'Business profile not found' }, 
        { status: 404 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const timeframe = searchParams.get('timeframe') || 'all'; // all, week, month, year
    
    // Calculate date range based on timeframe
    const now = new Date();
    let startDate = null;
    
    if (timeframe === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (timeframe === 'month') {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
    } else if (timeframe === 'year') {
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
    }

    // Build query to get all offers
    let query = supabase
      .from('offers')
      .select(`
        *,
        products (
          id,
          name,
          price
        )
      `)
      .eq('business_id', businessData.id);

    // Add date filtering if a timeframe was specified
    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    // Execute query
    const { data: offers, error: offersError } = await query;

    if (offersError) {
      console.error('Error fetching offers for analytics:', offersError.message);
      return NextResponse.json(
        { error: offersError.message }, 
        { status: 400 }
      );
    }

    // Prepare analytics data
    const now_iso = new Date().toISOString();
    
    const analytics = {
      total_offers: offers.length,
      active_offers: offers.filter(offer => 
        offer.is_active && 
        offer.start_date <= now_iso && 
        offer.expiry_date >= now_iso
      ).length,
      expired_offers: offers.filter(offer => 
        offer.expiry_date < now_iso
      ).length,
      upcoming_offers: offers.filter(offer => 
        offer.start_date > now_iso
      ).length,
      total_claims: offers.reduce((sum, offer) => sum + offer.current_claims, 0),
      offers_by_discount_range: {
        low: offers.filter(offer => offer.discount_percentage <= 25).length,
        medium: offers.filter(offer => offer.discount_percentage > 25 && offer.discount_percentage <= 50).length,
        high: offers.filter(offer => offer.discount_percentage > 50 && offer.discount_percentage <= 75).length,
        very_high: offers.filter(offer => offer.discount_percentage > 75).length
      },
      most_claimed_offers: [...offers]
        .sort((a, b) => b.current_claims - a.current_claims)
        .slice(0, 5)
        .map(offer => ({
          id: offer.id,
          product_name: offer.products.name,
          discount_percentage: offer.discount_percentage,
          claims: offer.current_claims,
          expiry_date: offer.expiry_date
        }))
    };

    // Add claim rate (percentage of max claims that have been used)
    const offersWithMaxClaims = offers.filter(offer => offer.max_claims !== null && offer.max_claims > 0);
    if (offersWithMaxClaims.length > 0) {
      const totalMaxClaims = offersWithMaxClaims.reduce((sum, offer) => sum + offer.max_claims, 0);
      const totalActualClaims = offersWithMaxClaims.reduce((sum, offer) => sum + offer.current_claims, 0);
      analytics.overall_claim_rate = totalMaxClaims > 0 ? 
        Math.round((totalActualClaims / totalMaxClaims) * 100) : 0;
    } else {
      analytics.overall_claim_rate = 0;
    }

    return NextResponse.json({ analytics }, { status: 200 });
  } catch (error) {
    console.error('Error fetching offer analytics:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}