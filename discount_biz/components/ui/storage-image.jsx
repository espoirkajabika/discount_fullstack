// components/ui/storage-image.jsx
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export function StorageImage({ 
  path, 
  alt = "Image", 
  className, 
  fallbackSize = "400x400",
  emptyIcon = null,
  ...props 
}) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get the storage URL from the path
  const getStorageUrl = (path) => {
    if (!path) return null;
    
    // If it's already a full URL, return it
    if (path.startsWith('http')) return path;
    
    // If it's a storage path, construct the URL
    if (path.includes('businesses/')) {
      // Try to get the Supabase URL from environment
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) {
        // Fallback: try to extract from current hostname or use a default pattern
        console.warn('NEXT_PUBLIC_SUPABASE_URL environment variable is not set');
        
        // Try to construct URL based on common Supabase pattern
        // This is a fallback - you should set the environment variable properly
        if (typeof window !== 'undefined') {
          // If we can detect the pattern from other API calls, use it
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          if (apiUrl && apiUrl.includes('supabase.co')) {
            const baseUrl = apiUrl.replace('/api/v1', '').replace('http://localhost:8001', '');
            if (baseUrl.includes('supabase.co')) {
              return `${baseUrl}/storage/v1/object/public/product-images/${path}`;
            }
          }
        }
        
        // Last resort: return null and show fallback
        return null;
      }
      return `${supabaseUrl}/storage/v1/object/public/product-images/${path}`;
    }
    
    // Otherwise, return as is
    return path;
  };

  const imageUrl = getStorageUrl(path);

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  // If no path or URL could be constructed, show empty state
  if (!imageUrl || imageError) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-gray-100 text-gray-400",
        className
      )} {...props}>
        {emptyIcon || (
          <div className="text-center">
            <svg 
              className="mx-auto h-12 w-12 text-gray-300" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
            <p className="mt-2 text-sm">No image</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} {...props}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
        </div>
      )}
      <img
        src={imageUrl}
        alt={alt}
        className={cn("w-full h-full object-cover", isLoading && "opacity-0")}
        onLoad={handleImageLoad}
        onError={handleImageError}
        {...props}
      />
    </div>
  );
}

export default StorageImage;