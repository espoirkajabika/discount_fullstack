'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const CustomerAuthContext = createContext();

export function CustomerAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [guestSessionId, setGuestSessionId] = useState(null);
  
  // Initialize Supabase client
  const supabase = createClientComponentClient({
    options: {
      persistSession: true,
      autoRefreshToken: true,
    }
  });

  // Fetch session data from API
  const fetchSessionFromAPI = async () => {
    try {
      console.log("Fetching session from API...");
      
      const response = await fetch('/api/customer/auth/session', {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        console.error('Session API returned non-OK response:', response.status);
        // Try to log the actual error message if possible
        try {
          const errorData = await response.json();
          console.error('Session error details:', errorData);
        } catch (e) {
          console.error('Could not parse error response');
        }
        
        clearAuthState();
        return false;
      }
      
      const data = await response.json();
      console.log("Session API response:", data);
      
      if (data.authenticated) {
        console.log("User is authenticated, updating state");
        setUser(data.user);
        setCustomer(data.customer);
        setIsLoggedIn(true);
        return true;
      } else {
        console.log("User is not authenticated according to session API");
        clearAuthState();
        // Check if there's a guest session ID
        if (data.isGuest && data.sessionId) {
          setGuestSessionId(data.sessionId);
        }
        return false;
      }
    } catch (error) {
      console.error("Error fetching session from API:", error);
      clearAuthState();
      return false;
    }
  };

  // Clear auth state
  const clearAuthState = () => {
    setUser(null);
    setCustomer(null);
    setIsLoggedIn(false);
  };

  // Initialize or create guest session
  const initializeGuestSession = async () => {
    try {
      const response = await fetch('/api/customer/guest/session', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('Failed to initialize guest session');
        return;
      }
      
      const data = await response.json();
      if (data.sessionId) {
        setGuestSessionId(data.sessionId);
      }
    } catch (error) {
      console.error('Error initializing guest session:', error);
    }
  };
  
  /**
   * Update user profile information
   */
  const updateProfile = async (profileData) => {
    try {
      const response = await fetch('/api/customer/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Failed to update profile' };
      }

      // Update the customer data in state
      setCustomer(data.profile);

      return { success: true, profile: data.profile };
    } catch (error) {
      console.error('Profile update error:', error);
      return { error: 'An unexpected error occurred' };
    }
  };

  /**
   * Update user avatar
   */
  const updateAvatar = async (avatarPath) => {
    try {
      // If we're setting to null, send a PATCH request to remove avatar
      if (avatarPath === null) {
        const response = await fetch('/api/customer/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ avatar: null }),
          credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to remove avatar');
        }

        // Update the customer data in state
        setCustomer(data.profile);
        return data.profile;
      }

      // Otherwise, update the avatar in the customer profile
      const response = await fetch('/api/customer/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ avatar: avatarPath }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update avatar');
      }

      // Update the customer data in state
      setCustomer(data.profile);
      return data.profile;
    } catch (error) {
      console.error('Avatar update error:', error);
      throw error;
    }
  };
  
  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      
      try {
        // First try to get authenticated session
        const isAuthenticated = await fetchSessionFromAPI();
        
        // If not authenticated, ensure we have a guest session
        if (!isAuthenticated && !guestSessionId) {
          await initializeGuestSession();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };
    
    initializeAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        
        if (event === 'SIGNED_IN') {
          await fetchSessionFromAPI();
        } else if (event === 'TOKEN_REFRESHED') {
          await fetchSessionFromAPI();
        } else if (event === 'SIGNED_OUT') {
          clearAuthState();
        }
      }
    );
    
    // Cleanup function
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Fetch customer profile when user changes
  useEffect(() => {
    // Fetch customer profile data if user is logged in
    const fetchCustomerProfile = async () => {
      try {
        const response = await fetch('/api/customer/profile', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setCustomer(data.profile);
        }
      } catch (error) {
        console.error('Error fetching customer profile:', error);
      }
    };
    
    if (user) {
      fetchCustomerProfile();
    } else {
      setCustomer(null);
    }
  }, [user]);

  // Sign in function
  const signIn = async (email, password) => {
    try {
      console.log("Attempting sign in for:", email);
      
      const response = await fetch('/api/customer/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      console.log("Sign in response status:", response.status);
      
      // Get response text first
      const responseText = await response.text();
      console.log("Sign in response text length:", responseText?.length || 0);
      
      // Parse JSON if possible
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.error("Error parsing sign in response:", e);
        return { error: 'Failed to parse server response' };
      }
      
      if (!response.ok) {
        console.error("Sign in failed:", data.error || response.statusText);
        return { error: data.error || 'Login failed' };
      }
      
      // Refresh auth state
      console.log("Sign in successful, refreshing auth state");
      await fetchSessionFromAPI();
      
      return data;
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: 'An error occurred during sign in' };
    }
  };

  // Sign up function
  const signUp = async (userData) => {
    try {
      const response = await fetch('/api/customer/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { error: data.error || 'Signup failed' };
      }
      
      return data;
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: 'An error occurred during sign up' };
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      const response = await fetch('/api/customer/auth/signout', {
        method: 'POST',
        credentials: 'include'
      });
      
      // Clear client-side cookies as fallback
      document.cookie = 'sb-access-token=; Max-Age=0; path=/; SameSite=Lax';
      document.cookie = 'sb-refresh-token=; Max-Age=0; path=/; SameSite=Lax';
      
      clearAuthState();
      
      return await response.json();
    } catch (error) {
      console.error('Sign out error:', error);
      clearAuthState();
      return { error: 'An error occurred during sign out' };
    }
  };

  // Reset password function
  const resetPassword = async (email) => {
    try {
      const response = await fetch('/api/customer/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Failed to send reset email' };
      }

      return data;
    } catch (error) {
      console.error('Error sending reset email:', error);
      return { error: 'An unexpected error occurred' };
    }
  };

  // Update password function
  const updatePassword = async (password) => {
    try {
      const response = await fetch('/api/customer/auth/reset-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Failed to update password' };
      }

      return data;
    } catch (error) {
      console.error('Error updating password:', error);
      return { error: 'An unexpected error occurred' };
    }
  };

  // Provide auth values
  const value = {
    user,
    customer,
    isLoggedIn,
    isLoading,
    isInitialized,
    guestSessionId,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    updateAvatar
  };

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(CustomerAuthContext);
}