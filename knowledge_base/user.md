# SaverSpot Customer Next.js App Setup

## Project Creation

```bash
# Create a new Next.js app with TypeScript
npx create-next-app@latest savespot-customer --typescript

# Navigate to the project directory
cd savespot-customer

# Install UI dependencies
npm install @/shadcn/ui
npx shadcn-ui@latest init

# Install additional dependencies
npm install @supabase/auth-helpers-nextjs @supabase/supabase-js react-hook-form zod axios lucide-react
```

## Directory Structure

Organize your project with the following structure:

```
savespot-customer/
├── public/
│   └── images/            # Static images
│
├── app/
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   │
│   ├── auth/              # Authentication pages
│   │   ├── login/
│   │   ├── signup/
│   │   └── reset-password/
│   │
│   ├── customer/          # Customer routes
│   │   ├── offers/        # Offers browsing
│   │   ├── saved-offers/  # Saved offers
│   │   ├── claimed/       # Claimed offers
│   │   └── profile/       # User profile
│
├── components/
│   ├── ui/                # Base UI components (shadcn/ui)
│   ├── layout/            # Layout components
│   │   ├── CustomerNavbar.tsx
│   │   └── Footer.tsx
│   │
│   ├── offers/            # Offer-related components
│   │   ├── OfferCard.tsx
│   │   └── OfferDetails.tsx
│   │
│   └── auth/              # Auth-related components
│       └── AuthForm.tsx
│
├── context/
│   └── CustomerAuthContext.tsx  # Auth context provider
│
├── services/
│   ├── api.ts             # API service
│   ├── auth-service.ts    # Auth service
│   └── offers-service.ts  # Offers service
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
│   ├── businesses.ts
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
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Auth Context Setup

Create a basic auth context in `context/CustomerAuthContext.tsx`:

```tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

type User = {
  id: string;
  email: string;
};

type Customer = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar: string | null;
};

type AuthContextType = {
  user: User | null;
  customer: Customer | null;
  isLoggedIn: boolean;
  isInitialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
};

const CustomerAuthContext = createContext<AuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
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
          
          // Fetch customer profile
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (data) {
            setCustomer({
              id: data.id,
              first_name: data.first_name,
              last_name: data.last_name,
              avatar: data.avatar_url
            });
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
          
          // Fetch customer profile
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (data) {
            setCustomer({
              id: data.id,
              first_name: data.first_name,
              last_name: data.last_name,
              avatar: data.avatar_url
            });
          }
        } else {
          setUser(null);
          setCustomer(null);
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

  // Sign up function
  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    
    if (error) {
      throw error;
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
    <CustomerAuthContext.Provider value={{
      user,
      customer,
      isLoggedIn: !!user,
      isInitialized,
      signIn,
      signUp,
      signOut,
    }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a CustomerAuthProvider');
  }
  return context;
}