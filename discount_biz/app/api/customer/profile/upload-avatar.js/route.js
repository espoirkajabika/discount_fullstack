// app/api/customer/profile/upload-avatar/route.js

import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import supabase from "@/lib/supabase";

export async function POST(request) {
  try {
    // Get the current session to verify authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Get customer's ID
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (customerError || !customerData) {
      return NextResponse.json(
        { error: 'Customer profile not found' }, 
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
    const filePath = `customers/${customerData.id}/avatar/${fileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

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

    // Update the customer's profile with the new avatar path
    const { error: updateError } = await supabase
      .from('customers')
      .update({ avatar: filePath })
      .eq('id', customerData.id);
      
    if (updateError) {
      console.error('Error updating customer profile with avatar:', updateError);
      return NextResponse.json(
        { error: updateError.message }, 
        { status: 400 }
      );
    }

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