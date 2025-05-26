// app/api/business/products/route.js

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

// CREATE - Add a new product
export async function POST(request) {
  try {
    // Get authenticated session
    const { session, error: authError } = await getAuthenticatedSession();
    
    if (authError) {
      return NextResponse.json(
        { error: authError }, 
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
    const { name, description, price, image_url } = await request.json();

    // Validate required fields
    if (!name || !price) {
      return NextResponse.json(
        { error: 'Product name and price are required' }, 
        { status: 400 }
      );
    }

    // Validate price format
    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      return NextResponse.json(
        { error: 'Price must be a valid positive number' }, 
        { status: 400 }
      );
    }

    // Insert the product
    const { data: product, error: insertError } = await supabase
      .from('products')
      .insert([
        {
          business_id: businessData.id,
          name,
          description,
          price: parseFloat(price),
          image_url
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

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Internal Server Error: ' + error.message }, 
      { status: 500 }
    );
  }
}

// READ - Get all products for the business
export async function GET(request) {
  try {
    // Get authenticated session
    const { session, error: authError } = await getAuthenticatedSession();
    
    if (authError) {
      return NextResponse.json(
        { error: authError }, 
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

    // Get search parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Calculate offset
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('business_id', businessData.id)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    // Add search if provided
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Execute query
    const { data: products, error: fetchError, count } = await query;

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message }, 
        { status: 400 }
      );
    }

    // Process images to ensure they have proper URLs
    const processedProducts = products.map(product => {
      if (product.image_url) {
        // If image_url is already a full URL (starts with http), leave it as is
        if (!product.image_url.startsWith('http')) {
          try {
            // Check if it's a path to Supabase storage
            if (product.image_url.includes('businesses/')) {
              const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(product.image_url);
              
              product.image_url = publicUrl;
            }
          } catch (urlError) {
            console.error('Error generating image URL:', urlError);
            // Don't fail the entire request if just the image URL is problematic
          }
        }
      }
      return product;
    });

    return NextResponse.json({
      products: processedProducts,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal Server Error: ' + error.message }, 
      { status: 500 }
    );
  }
}