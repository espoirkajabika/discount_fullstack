// app/api/customer/offers/[id]/unsave/route.js

import { NextResponse } from 'next/server';
import supabase from "@/lib/supabase";

// Helper to get authenticated customer
async function getAuthenticatedCustomer() {
  // Get the current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    return { error: 'Unauthorized: No valid session' };
  }
  
  // Get customer ID for the current user
  const { data: customerData, error: customerError } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', session.user.id)
    .single();
    
  if (customerError || !customerData) {
    return { error: 'Customer profile not found' };
  }
  
  return { customerId: customerData.id, userId: session.user.id };
}

// DELETE - Remove an offer from the customer's saved offers
export async function DELETE(request) {
  try {
    // Extract the offer ID from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    // The ID will be the last part in the path: /api/customer/offers/{id}/unsave
    const id = pathParts[pathParts.length - 2];
    
    if (!id) {
      return NextResponse.json(
        { error: 'Offer ID is required' }, 
        { status: 400 }
      );
    }
    
    // Get authenticated customer
    const { customerId, error: authError } = await getAuthenticatedCustomer();
    
    if (authError) {
      return NextResponse.json(
        { error: authError }, 
        { status: 401 }
      );
    }
    
    // Remove the saved offer
    const { error: deleteError } = await supabase
      .from('customer_saved_offers')
      .delete()
      .eq('customer_id', customerId)
      .eq('offer_id', id);
      
    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message }, 
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Offer removed from saved offers'
    }, { status: 200 });
  } catch (error) {
    console.error('Error removing saved offer:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}