// context/AuthContext.js
"use client"

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();
  
  // Initialize Supabase client
  const supabase = createClientComponentClient({
    options: {
      persistSession: true,
      autoRefreshToken: true,
    }
  });

  useEffect(() => {
    // Function to fetch session data from API
    const fetchSessionFromAPI = async () => {
      try {
        console.log('Fetching session from API');
        const response = await fetch('/api/business/auth/session', {
          credentials: 'include', // Important for cookies
          cache: 'no-store', // Prevent caching
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          console.log('Session API returned non-OK response:', response.status);
          // Clear session state if unauthorized
          setUser(null);
          setBusiness(null);
          setIsLoggedIn(false);
          return false;
        }
        
        const data = await response.json();
        console.log('Session API response:', data.authenticated ? 'Authenticated' : 'Not authenticated');
        
        if (data.authenticated) {
          setUser(data.user);
          setBusiness(data.business);
          setIsLoggedIn(true);
          return true;
        } else {
          setUser(null);
          setBusiness(null);
          setIsLoggedIn(false);
          return false;
        }
      } catch (error) {
        console.error("Error fetching session from API:", error);
        setUser(null);
        setBusiness(null);
        setIsLoggedIn(false);
        return false;
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    // Check auth status on mount and setup auth state change listener
    const setupAuth = async () => {
      try {
        // First try to get session from API
        await fetchSessionFromAPI();
        
        // Setup auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log("Auth state changed:", event, session?.user?.email || null);
            
            if (event === 'SIGNED_IN') {
              console.log('User signed in', session?.user?.email);
              await fetchSessionFromAPI();
            } else if (event === 'TOKEN_REFRESHED') {
              console.log('Token refreshed');
              await fetchSessionFromAPI();
            } else if (event === 'SIGNED_OUT') {
              console.log('User signed out');
              setUser(null);
              setBusiness(null);
              setIsLoggedIn(false);
              
              // Only redirect if we're not already on an auth page
              const currentPath = window.location.pathname;
              if (!currentPath.includes('/business/auth/')) {
                router.push('/business/auth/login');
              }
            }
          }
        );
        
        // Return unsubscribe function
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error setting up auth:", error);
        setLoading(false);
        setInitialized(true);
      }
    };

    const unsubscribe = setupAuth();
    
    // Cleanup function
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [router, supabase]);
  
  // Show loading state until authentication is checked
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 rounded-full"></div>
      </div>
    );
  }

  // Value to share through context
  const value = {
    user,
    business,
    isLoggedIn,
    loading,
    initialized
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}