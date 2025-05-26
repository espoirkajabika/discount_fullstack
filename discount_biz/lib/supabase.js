// lib/supabase.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a single instance of the supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Important for cookie-based auth
  },
  cookies: {
    // Necessary to work correctly with Next.js App Router
    name: 'sb',
    lifetime: 60 * 60 * 24 * 7, // 7 days
    domain: '',
    path: '/',
    sameSite: 'lax',
  },
  global: {
    fetch: fetch, // Use native fetch for better cookie handling
  }
});

export default supabase;