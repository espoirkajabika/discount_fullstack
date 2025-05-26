// app/api/business/offers/[id]/route.js

import { NextResponse } from 'next/server';
import supabase from "@/lib/supabase";
import supabaseAdmin from "@/lib/supabase-admin";

// Helper function to verify business ownership of an offer
async function verifyOfferOwnership(offerId, userId) {
  // Get user's business ID
  const { data: businessData, error: businessError } = await supabaseAdmin
    .from('businesses')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (businessError || !businessData) {
    return { error: 'Business profile not found', status: 404 };
  }

  // Check if the offer belongs to the business
  const { data: offer, error: offerError } = await supabase
    .from('offers')
    .select(`
      *,
      products (
        id,
        name,
        price,
        image_url
      )
    `)
    .eq('id', offerId)
    .eq('business_id', businessData.id)
    .single();

  if (offerError) {
    return { error: 'Offer not found', status: 404 };
  }

  return { businessId: businessData.id, offer };
}

// READ - Get a single offer by ID
export async function GET(request) {
  try {
    // Extract the offer ID from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const offerId = pathParts[pathParts.length - 1];
    
    if (!offerId) {
      return NextResponse.json({ error: 'Offer ID is required' }, { status: 400 });
    }

    // Get the current session to verify authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Verify ownership and get offer
    const { error, status, offer } = await verifyOfferOwnership(offerId, session.user.id);
    
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    return NextResponse.json({ offer }, { status: 200 });
  } catch (error) {
    console.error('Error fetching offer:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}

// UPDATE - Update an offer by ID
export async function PATCH(request) {
  try {
    // Extract the offer ID from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const offerId = pathParts[pathParts.length - 1];
    
    if (!offerId) {
      return NextResponse.json({ error: 'Offer ID is required' }, { status: 400 });
    }

    // Get the current session to verify authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Verify ownership and get business ID
    const { error, status, businessId, offer: existingOffer } = await verifyOfferOwnership(offerId, session.user.id);
    
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    // Parse the request body
    const updates = await request.json();
    const { 
      discount_percentage, 
      discount_code, 
      start_date, 
      expiry_date, 
      is_active, 
      max_claims 
    } = updates;

    // Create an object with only the fields to update
    const updateData = {};
    if (discount_code !== undefined) updateData.discount_code = discount_code;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    // Validate discount percentage if provided
    if (discount_percentage !== undefined) {
      if (discount_percentage < 1 || discount_percentage > 100) {
        return NextResponse.json(
          { error: 'Discount percentage must be between 1 and 100' }, 
          { status: 400 }
        );
      }
      updateData.discount_percentage = discount_percentage;
    }

    // Validate dates if provided
    if (start_date !== undefined) {
      const startDateObj = new Date(start_date);
      if (isNaN(startDateObj.getTime())) {
        return NextResponse.json(
          { error: 'Invalid start date format' }, 
          { status: 400 }
        );
      }
      updateData.start_date = start_date;
    }

    if (expiry_date !== undefined) {
      const expiryDateObj = new Date(expiry_date);
      if (isNaN(expiryDateObj.getTime())) {
        return NextResponse.json(
          { error: 'Invalid expiry date format' }, 
          { status: 400 }
        );
      }
      updateData.expiry_date = expiry_date;
    }

    // Check if start date is before expiry date
    const finalStartDate = updateData.start_date || existingOffer.start_date;
    const finalExpiryDate = updateData.expiry_date || existingOffer.expiry_date;
    
    if (new Date(finalExpiryDate) <= new Date(finalStartDate)) {
      return NextResponse.json(
        { error: 'Expiry date must be after start date' }, 
        { status: 400 }
      );
    }

    // Validate max_claims if provided
    if (max_claims !== undefined) {
      if (max_claims !== null && (isNaN(parseInt(max_claims)) || parseInt(max_claims) < 0)) {
        return NextResponse.json(
          { error: 'Max claims must be a valid positive number or null' }, 
          { status: 400 }
        );
      }
      updateData.max_claims = max_claims;
    }

    // Ensure at least one field is being updated
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' }, 
        { status: 400 }
      );
    }

    // Update the offer
    const { data: updatedOffer, error: updateError } = await supabase
      .from('offers')
      .update(updateData)
      .eq('id', offerId)
      .eq('business_id', businessId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message }, 
        { status: 400 }
      );
    }

    return NextResponse.json({ offer: updatedOffer }, { status: 200 });
  } catch (error) {
    console.error('Error updating offer:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}

// DELETE - Delete an offer by ID
export async function DELETE(request) {
  try {
    // Extract the offer ID from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const offerId = pathParts[pathParts.length - 1];
    
    if (!offerId) {
      return NextResponse.json({ error: 'Offer ID is required' }, { status: 400 });
    }

    // Get the current session to verify authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Verify ownership and get business ID
    const { error, status, businessId } = await verifyOfferOwnership(offerId, session.user.id);
    
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    // Delete the offer
    const { error: deleteError } = await supabase
      .from('offers')
      .delete()
      .eq('id', offerId)
      .eq('business_id', businessId);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message }, 
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Offer deleted successfully' }, 
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting offer:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}