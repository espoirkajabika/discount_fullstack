// app/api/business/products/[id]/route.js

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
    console.error('Product error:', productError);
    return { error: 'Product not found', status: 404 };
  }

  return { businessId: businessData.id, product };
}

// READ - Get a single product by ID
export async function GET(req) {
  try {
    // Extract the product ID from the URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const productId = pathParts[pathParts.length - 1];
    
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

    // Verify ownership and get product
    const { error, status, businessId, product } = await verifyProductOwnership(productId, session.user.id);
    
    if (error) {
      return NextResponse.json({ error }, { status: status || 400 });
    }

    // Generate public URL for image if it exists
    if (product && product.image_url) {
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

    return NextResponse.json({ product }, { status: 200 });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Internal Server Error: ' + error.message }, 
      { status: 500 }
    );
  }
}

// UPDATE - Update a product by ID
export async function PATCH(req) {
  try {
    // Extract the product ID from the URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const productId = pathParts[pathParts.length - 1];
    
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

    // Verify ownership and get original product
    const { error, status, businessId, product: existingProduct } = await verifyProductOwnership(productId, session.user.id);
    
    if (error) {
      return NextResponse.json({ error }, { status: status || 400 });
    }

    // Parse the request body
    const { name, description, price, image_url } = await req.json();
    
    // Create an update object with only the fields to update
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (image_url !== undefined) updateData.image_url = image_url;
    
    // Validate price if provided
    if (price !== undefined) {
      const numericPrice = parseFloat(price);
      if (isNaN(numericPrice) || numericPrice < 0) {
        return NextResponse.json(
          { error: 'Price must be a valid positive number' }, 
          { status: 400 }
        );
      }
      updateData.price = numericPrice;
    }

    // Update the product
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .eq('business_id', businessId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message }, 
        { status: 400 }
      );
    }

    // Generate public URL for image if it exists
    if (updatedProduct && updatedProduct.image_url) {
      if (!updatedProduct.image_url.startsWith('http')) {
        try {
          if (updatedProduct.image_url.includes('businesses/')) {
            const { data: { publicUrl } } = supabase.storage
              .from('product-images')
              .getPublicUrl(updatedProduct.image_url);
            
            updatedProduct.image_url = publicUrl;
          }
        } catch (urlError) {
          console.error('Error generating image URL:', urlError);
        }
      }
    }

    return NextResponse.json({ product: updatedProduct }, { status: 200 });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Internal Server Error: ' + error.message }, 
      { status: 500 }
    );
  }
}

// DELETE - Delete a product by ID
export async function DELETE(req) {
  try {
    // Extract the product ID from the URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const productId = pathParts[pathParts.length - 1];
    
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

    // Delete the product
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('business_id', businessId);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message }, 
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Product deleted successfully' }, 
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Internal Server Error: ' + error.message }, 
      { status: 500 }
    );
  }
}