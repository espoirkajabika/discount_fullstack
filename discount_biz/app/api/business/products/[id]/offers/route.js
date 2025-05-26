// app/api/business/products/[id]/offers/route.js

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import supabase from "@/lib/supabase";
import supabaseAdmin from "@/lib/supabase-admin";

// Helper to get authenticated session
async function getAuthenticatedSession() {
  // Get the cookies for authentication - using await with cookies()
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;
  const refreshToken = cookieStore.get('sb-refresh-token')?.value;
  
  // Attempt to get session with tokens if available
  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    
    if (error) {
      console.error('Session error:', error);
      return { error: 'Unauthorized: Invalid session' };
    }
    
    return { session: data.session };
  }
  
  // Get the current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    return { error: 'Unauthorized: No valid session' };
  }
  
  return { session };
}

// Helper function to verify business ownership of a product
async function verifyProductOwnership(productId, userId) {
  // Get user's business ID
  const { data: businessData, error: businessError } = await supabaseAdmin
    .from('businesses')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (businessError || !businessData) {
    return { error: 'Business profile not found', status: 404 };
  }

  // Check if the product belongs to the business
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('business_id', businessData.id)
    .single();

  if (productError) {
    return { error: 'Product not found', status: 404 };
  }

  return { businessId: businessData.id, product };
}

// GET - Get all offers for a specific product
export async function GET(req) {
  try {
    // Extract the product ID from the URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    // The ID will be second to last in the path: /api/business/products/{id}/offers
    const productId = pathParts[pathParts.length - 2];
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Get authenticated session
    const { session, error: authError } = await getAuthenticatedSession();
    
    if (authError) {
      return NextResponse.json(
        { error: authError }, 
        { status: 401 }
      );
    }
    
    // Verify ownership
    const { error, status, businessId } = await verifyProductOwnership(productId, session.user.id);
    
    if (error) {
      return NextResponse.json({ error }, { status: status || 400 });
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const includeExpired = searchParams.get('includeExpired') === 'true';
    const includeInactive = searchParams.get('includeInactive') === 'true';
    
    // Build query
    let query = supabase
      .from('offers')
      .select('*')
      .eq('business_id', businessId)
      .eq('product_id', productId);

    // Filter out expired offers if not requested
    if (!includeExpired) {
      const now = new Date().toISOString();
      query = query.gte('expiry_date', now);
    }

    // Filter out inactive offers if not requested
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    // Order by expiry date (soonest first)
    query = query.order('expiry_date', { ascending: true });

    // Execute query
    const { data: offers, error: offersError } = await query;

    if (offersError) {
      return NextResponse.json(
        { error: offersError.message }, 
        { status: 400 }
      );
    }

    return NextResponse.json({ offers }, { status: 200 });
  } catch (error) {
    console.error('Error fetching product offers:', error);
    return NextResponse.json(
      { error: 'Internal Server Error: ' + error.message }, 
      { status: 500 }
    );
  }
}