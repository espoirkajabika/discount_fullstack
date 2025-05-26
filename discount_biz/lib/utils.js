import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// New utility function for handling Supabase storage URLs
export function getStorageUrl(path) {
  if (!path) return null;
  
  // If it's already a full URL, return it
  if (path.startsWith('http')) return path;
  
  // If it's a storage path, construct the URL
  if (path.includes('businesses/')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('NEXT_PUBLIC_SUPABASE_URL environment variable is not set');
      return null;
    }
    return `${supabaseUrl}/storage/v1/object/public/product-images/${path}`;
  }
  
  // Otherwise, return as is
  return path;
}