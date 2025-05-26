'use client';

import React, { useState } from 'react';
import { Tag } from 'lucide-react';

export function StorageImage({ 
  path, 
  alt = "Image", 
  className = "", 
  fallbackSize = "400x400",
  emptyIcon,
  ...props 
}) {
  const [error, setError] = useState(false);
  
  // Function to get the correct image URL
  const getImageUrl = (imagePath) => {
    // If no path provided, return null
    if (!imagePath) return null;
    
    // If it's already a full URL, return it
    if (imagePath.startsWith('http')) return imagePath;
    
    // If it's a Supabase storage path, construct the full URL
    if (imagePath.includes('businesses/')) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) {
        console.error('NEXT_PUBLIC_SUPABASE_URL environment variable is not set');
        return null;
      }
      return `${supabaseUrl}/storage/v1/object/public/product-images/${imagePath}`;
    }
    
    // Otherwise, return as is
    return imagePath;
  };
  
  // Generate the image URL
  const imageUrl = getImageUrl(path);
  
  // If no image URL or there was an error loading the image
  if (!imageUrl || error) {
    // If we have a custom empty icon, use that
    if (emptyIcon) {
      return (
        <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
          {emptyIcon}
        </div>
      );
    }
    
    // Show a placeholder if path was provided but errored
    if (path) {
      return (
        <img 
          src={`https://placehold.co/${fallbackSize}?text=No+Image`} 
          alt={alt}
          className={className}
          {...props}
        />
      );
    }
    
    // Show an empty icon if no path was provided
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <Tag className="h-12 w-12 text-gray-300" />
      </div>
    );
  }
  
  // Otherwise, render the image
  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      {...props}
    />
  );
}