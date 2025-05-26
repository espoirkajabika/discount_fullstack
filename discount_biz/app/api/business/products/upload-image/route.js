// app/api/business/products/upload-image/route.js

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import supabase from "@/lib/supabase";
import supabaseAdmin from "@/lib/supabase-admin";
import { v4 as uuidv4 } from 'uuid';

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

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('image');
    
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No image file provided' }, 
        { status: 400 }
      );
    }

    // Validate file type
    const fileType = file.type;
    if (!fileType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Uploaded file must be an image' }, 
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Image size must be less than 5MB' }, 
        { status: 400 }
      );
    }

    // Generate a unique filename
    const fileExt = fileType.split('/')[1];
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `businesses/${businessData.id}/products/${fileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    console.log('Uploading file to path:', filePath);

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, buffer, {
        contentType: fileType,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: uploadError.message }, 
        { status: 400 }
      );
    }

    // Get the public URL for the uploaded image
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    console.log('Generated public URL:', publicUrl);
    console.log('File path for storage:', filePath);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath  // Return the storage path - this is what we need to store in the database
    }, { status: 200 });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Internal Server Error: ' + error.message }, 
      { status: 500 }
    );
  }
}