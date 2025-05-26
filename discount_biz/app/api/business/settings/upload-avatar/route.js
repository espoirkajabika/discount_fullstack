// app/api/business/settings/upload-avatar/route.js

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import supabase from "@/lib/supabase";
import supabaseAdmin from "@/lib/supabase-admin";
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    // Get the cookies for authentication
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;
    const refreshToken = cookieStore.get('sb-refresh-token')?.value;
    
    let session;
    
    // Attempt to get session with tokens if available
    if (accessToken && refreshToken) {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
      
      if (!error) {
        session = data.session;
      }
    }
    
    // If that failed, try getting the session directly
    if (!session) {
      const { data, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !data.session) {
        console.error('Authentication error:', sessionError || 'No session found');
        return NextResponse.json(
          { error: 'Unauthorized: Invalid session' }, 
          { status: 401 }
        );
      }
      
      session = data.session;
    }
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid session' }, 
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

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Image size must be less than 2MB' }, 
        { status: 400 }
      );
    }

    // Generate a unique filename
    const fileExt = fileType.split('/')[1];
    const fileName = `${uuidv4()}.${fileExt}`;
    let filePath = `businesses/${businessData.id}/avatar/${fileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    console.log('Attempting to upload file to path:', filePath);

    // Use the product-images bucket since we know it works
    const bucketName = 'product-images';
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
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
      .from(bucketName)
      .getPublicUrl(filePath);

    console.log('Generated public URL:', publicUrl);
    console.log('File path for storage:', filePath);

    // Return both the public URL and the storage path
    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath
    }, { status: 200 });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json(
      { error: 'Internal Server Error: ' + error.message }, 
      { status: 500 }
    );
  }
}