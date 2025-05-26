// app/api/business/offers/route.js

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import supabase from "@/lib/supabase";
import supabaseAdmin from "@/lib/supabase-admin";

// Helper to get authenticated session with multiple fallbacks
async function getAuthenticatedSession() {
  // Method 1: Direct Supabase auth check
  const { data: { session: supabaseSession }, error: sessionError } = 
    await supabase.auth.getSession();
  
  if (supabaseSession) {
    return { session: supabaseSession };
  }
  
  // Method 2: Check cookies directly
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;
  const refreshToken = cookieStore.get('sb-refresh-token')?.value;
  
  // Debug log
  console.log('Cookie check - Access token exists:', !!accessToken, 'Refresh token exists:', !!refreshToken);
  
  if (accessToken && refreshToken) {
    // Try to restore session from tokens
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    
    if (!error) {
      return { session: data.session };
    } else {
      return { error: 'Invalid session tokens' };
    }
  }
  
  return { error: 'No valid session found' };
}

// READ - Get all offers for the business
export async function GET(request) {
  try {
    console.log('Offers API called');
    
    // Get authenticated session with enhanced fallbacks
    const { session, error: authError } = await getAuthenticatedSession();
    
    if (authError || !session) {
      console.error('Authentication error in offers API:', authError);
      return NextResponse.json(
        { error: 'You need to be logged in to view offers. Please sign in again.' }, 
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

    // Get search parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const status = searchParams.get('status'); // 'active', 'expired', 'upcoming'
    const productId = searchParams.get('productId');
    
    // Calculate offset
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('offers')
      .select(`
        *,
        products (
          id,
          name,
          price,
          image_url
        )
      `, { count: 'exact' })
      .eq('business_id', businessData.id)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    // Filter by product if provided
    if (productId) {
      query = query.eq('product_id', productId);
    }

    // Filter by status if provided
    const now = new Date().toISOString();
    if (status === 'active') {
      query = query.lt('start_date', now).gt('expiry_date', now).eq('is_active', true);
    } else if (status === 'expired') {
      query = query.lt('expiry_date', now);
    } else if (status === 'upcoming') {
      query = query.gt('start_date', now);
    }

    // Execute query
    const { data: offers, error: fetchError, count } = await query;

    if (fetchError) {
      console.error('Error fetching offers:', fetchError);
      return NextResponse.json(
        { error: fetchError.message }, 
        { status: 400 }
      );
    }

    console.log(`Successfully fetched ${offers.length} offers`);

    return NextResponse.json({
      offers,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error in offers API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}

// CREATE - Add a new offer
export async function POST(request) {
  try {
    // Get authenticated session with enhanced fallbacks
    const { session, error: authError } = await getAuthenticatedSession();
    
    if (authError || !session) {
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
      return NextResponse.json(
        { error: 'Business profile not found' }, 
        { status: 404 }
      );
    }

    // Parse the request body
    const { 
      product_id, 
      discount_percentage, 
      discount_code, 
      start_date, 
      expiry_date, 
      is_active, 
      max_claims 
    } = await request.json();

    // Validate required fields
    if (!product_id || !discount_percentage || !start_date || !expiry_date) {
      return NextResponse.json(
        { error: 'Product ID, discount percentage, start date, and expiry date are required' }, 
        { status: 400 }
      );
    }

    // Validate discount percentage (between 1 and 100)
    if (discount_percentage < 1 || discount_percentage > 100) {
      return NextResponse.json(
        { error: 'Discount percentage must be between 1 and 100' }, 
        { status: 400 }
      );
    }

    // Validate dates
    const startDateObj = new Date(start_date);
    const expiryDateObj = new Date(expiry_date);
    
    if (isNaN(startDateObj.getTime()) || isNaN(expiryDateObj.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' }, 
        { status: 400 }
      );
    }

    if (expiryDateObj <= startDateObj) {
      return NextResponse.json(
        { error: 'Expiry date must be after start date' }, 
        { status: 400 }
      );
    }

    // Verify the product belongs to the business
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', product_id)
      .eq('business_id', businessData.id)
      .single();

    if (productError || !productData) {
      return NextResponse.json(
        { error: 'Product not found or does not belong to your business' }, 
        { status: 404 }
      );
    }

    // Insert the offer
    const { data: offer, error: insertError } = await supabase
      .from('offers')
      .insert([
        {
          business_id: businessData.id,
          product_id,
          discount_percentage,
          discount_code,
          start_date,
          expiry_date,
          is_active: is_active !== undefined ? is_active : true,
          max_claims,
          current_claims: 0
        }
      ])
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message }, 
        { status: 400 }
      );
    }

    return NextResponse.json({ offer }, { status: 201 });
  } catch (error) {
    console.error('Error creating offer:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}