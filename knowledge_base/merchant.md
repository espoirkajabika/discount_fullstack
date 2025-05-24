# SaverSpot Business Next.js App Setup

## Project Creation

```bash
# Create a new Next.js app with TypeScript
npx create-next-app@latest savespot-business --typescript

# Navigate to the project directory
cd savespot-business

# Install UI dependencies
npm install @/shadcn/ui
npx shadcn-ui@latest init

# Install additional dependencies
npm install @supabase/auth-helpers-nextjs @supabase/supabase-js react-hook-form zod axios lucide-react recharts date-fns
```

## Directory Structure

Organize your project with the following structure:

```
savespot-business/
├── public/
│   └── images/            # Static images
│
├── app/
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home/Landing page
│   │
│   ├── auth/              # Authentication pages
│   │   ├── login/
│   │   ├── signup/
│   │   └── reset-password/
│   │
│   ├── dashboard/         # Dashboard routes
│   │   ├── page.tsx       # Main dashboard
│   │   ├── layout.tsx     # Dashboard layout
│   │   ├── products/      # Product management
│   │   ├── offers/        # Offer management
│   │   ├── analytics/     # Business analytics
│   │   └── settings/      # Account settings
│
├── components/
│   ├── ui/                # Base UI components (shadcn/ui)
│   │
│   ├── layout/            # Layout components
│   │   ├── BusinessNavbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   │
│   ├── dashboard/         # Dashboard components
│   │   ├── AnalyticsCard.tsx
│   │   ├── RecentOffers.tsx
│   │   └── StatCard.tsx
│   │
│   ├── products/          # Product-related components
│   │   ├── ProductForm.tsx
│   │   ├── ProductList.tsx
│   │   └── ProductCard.tsx
│   │
│   ├── offers/            # Offer-related components
│   │   ├── OfferForm.tsx
│   │   ├── OfferList.tsx
│   │   └── OfferCard.tsx
│   │
│   └── auth/              # Auth-related components
│       └── AuthForm.tsx
│
├── context/
│   └── BusinessAuthContext.tsx  # Auth context provider
│
├── services/
│   ├── api.ts             # API service
│   ├── auth-service.ts    # Auth service
│   ├── product-service.ts # Products service
│   └── offer-service.ts   # Offers service
│
├── lib/
│   ├── supabase.ts        # Supabase client
│   └── utils.ts           # Utility functions
│
├── styles/
│   ├── globals.css        # Global styles
│   └── theme.css          # Theme customization
│
├── types/                 # TypeScript type definitions
│   ├── offers.ts
│   ├── products.ts
│   ├── business.ts
│   └── auth.ts
│
├── .env.local             # Environment variables (gitignored)
├── .env.example           # Example environment variables
├── next.config.js         # Next.js configuration
└── package.json           # Project dependencies
```

## Environment Variables

Create a `.env.example` file with:

```
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Authentication
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

## Auth Context Setup

Create a basic auth context in `context/BusinessAuthContext.tsx`:

```tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

type User = {
  id: string;
  email: string;
};

type Business = {
  id: string;
  business_name: string;
  business_address: string | null;
  phone_number: string | null;
  business_website: string | null;
  avatar_url: string | null;
  is_verified: boolean;
};

type AuthContextType = {
  user: User | null;
  business: Business | null;
  isLoggedIn: boolean;
  isInitialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, businessName: string) => Promise<void>;
};

const BusinessAuthContext = createContext<AuthContextType | undefined>(undefined);

export function BusinessAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  // Check for session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser({
            id: session.user.id,
            email: session.user.email || ''
          });
          
          // Fetch profile and check if business
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_business')
            .eq('id', session.user.id)
            .single();
            
          if (profile && profile.is_business) {
            // Fetch business details
            const { data: businessData } = await supabase
              .from('businesses')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
              
            if (businessData) {
              setBusiness(businessData);
            }
          } else {
            // Not a business account
            setUser(null);
            await supabase.auth.signOut();
            router.push('/auth/login?error=not_business');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsInitialized(true);
      }
    };
    
    initializeAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUser({
            id: session.user.id,
            email: session.user.email || ''
          });
          
          // Fetch profile and check if business
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_business')
            .eq('id', session.user.id)
            .single();
            
          if (profile && profile.is_business) {
            // Fetch business details
            const { data: businessData } = await supabase
              .from('businesses')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
              
            if (businessData) {
              setBusiness(businessData);
            }
          } else if (event === 'SIGNED_IN') {
            // New sign in but not a business account
            await supabase.auth.signOut();
            router.push('/auth/login?error=not_business');
          }
        } else {
          setUser(null);
          setBusiness(null);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      throw error;
    }
  };

  // Sign up function for business
  const signUp = async (email: string, password: string, businessName: string) => {
    // First sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    
    if (error) {
      throw error;
    }
    
    if (data.user) {
      // Set profile as business
      await supabase.from('profiles').update({
        is_business: true
      }).eq('id', data.user.id);
      
      // Create business record
      await supabase.from('businesses').insert({
        user_id: data.user.id,
        business_name: businessName
      });
    }
  };

  // Sign out function
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    router.push('/');
  };

  return (
    <BusinessAuthContext.Provider value={{
      user,
      business,
      isLoggedIn: !!user && !!business,
      isInitialized,
      signIn,
      signUp,
      signOut,
    }}>
      {children}
    </BusinessAuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(BusinessAuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a BusinessAuthProvider');
  }
  return context;
}
```

## API Service Setup

Create a basic API service in `services/api.ts`:

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// API base URL from environment
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Initialize Supabase client for auth
const supabase = createClientComponentClient();

/**
 * Helper function to make authenticated API requests
 */
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  // Default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  } as HeadersInit;
  
  // Add authorization header if session exists
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  
  // Make the request
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include'
  });
  
  // Check if the response is ok
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'An error occurred');
  }
  
  // Parse and return the response data
  return await response.json();
};

/**
 * Business Profile API Functions
 */
export const businessApi = {
  // Get business profile
  getProfile: async () => {
    return apiRequest('/business/profile');
  },
  
  // Update business profile
  updateProfile: async (profileData: any) => {
    return apiRequest('/business/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },
  
  // Get business analytics
  getAnalytics: async (period = '30d') => {
    return apiRequest(`/business/analytics?period=${period}`);
  }
};

/**
 * Products API Functions
 */
export const productsApi = {
  // Get all products for the business
  getProducts: async (page = 1, limit = 10) => {
    return apiRequest(`/business/products?page=${page}&limit=${limit}`);
  },
  
  // Get a single product
  getProductById: async (id: string) => {
    return apiRequest(`/business/products/${id}`);
  },
  
  // Create a new product
  createProduct: async (productData: any) => {
    return apiRequest('/business/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },
  
  // Update a product
  updateProduct: async (id: string, productData: any) => {
    return apiRequest(`/business/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  },
  
  // Delete a product
  deleteProduct: async (id: string) => {
    return apiRequest(`/business/products/${id}`, {
      method: 'DELETE'
    });
  }
};

/**
 * Offers API Functions
 */
export const offersApi = {
  // Get all offers for the business
  getOffers: async (page = 1, limit = 10, status = 'all') => {
    return apiRequest(`/business/offers?page=${page}&limit=${limit}&status=${status}`);
  },
  
  // Get a single offer
  getOfferById: async (id: string) => {
    return apiRequest(`/business/offers/${id}`);
  },
  
  // Create a new offer
  createOffer: async (offerData: any) => {
    return apiRequest('/business/offers', {
      method: 'POST',
      body: JSON.stringify(offerData)
    });
  },
  
  // Update an offer
  updateOffer: async (id: string, offerData: any) => {
    return apiRequest(`/business/offers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(offerData)
    });
  },
  
  // Delete an offer
  deleteOffer: async (id: string) => {
    return apiRequest(`/business/offers/${id}`, {
      method: 'DELETE'
    });
  },
  
  // Get offer analytics
  getOfferAnalytics: async (id: string) => {
    return apiRequest(`/business/offers/${id}/analytics`);
  }
};

export default {
  business: businessApi,
  products: productsApi,
  offers: offersApi
};
```

## Dashboard Layout Setup

Create a basic dashboard layout in `app/dashboard/layout.tsx`:

```tsx
'use client'

import { useAuth } from '@/context/BusinessAuthContext';
import Sidebar from '@/components/layout/Sidebar';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoggedIn, isInitialized } = useAuth();
  const router = useRouter();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (isInitialized && !isLoggedIn) {
      router.push('/auth/login');
    }
  }, [isLoggedIn, isInitialized, router]);
  
  // Show loading state while checking auth
  if (!isInitialized) {
    return (
      <div className="flex h-screen">
        <Skeleton className="h-full w-64" />
        <div className="flex-1 p-8">
          <Skeleton className="h-12 w-full mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }
  
  // If not logged in, don't render anything (will redirect)
  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}
```

## Next Steps

1. Set up the root layout with auth provider
2. Create login and signup pages
3. Implement the Sidebar component
4. Create the dashboard home page
5. Set up product management pages
6. Set up offer management pages