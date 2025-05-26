'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/CustomerAuthContext';

// Import components
import SavedOffersList from '@/app/_components/SavedOffersList';
import { Heart } from 'lucide-react';

export default function SavedOffersPage() {
  const router = useRouter();
  const { isLoggedIn, isInitialized } = useAuth();
  
  // Redirect if not logged in
  useEffect(() => {
    if (isInitialized && !isLoggedIn) {
      router.push('/customer/auth/login?redirect=/customer/saved-offers');
    }
  }, [isLoggedIn, isInitialized, router]);
  
  return (
    <div>
      <div className="flex items-center mb-6">
        <Heart className="text-red-500 mr-2 h-6 w-6" />
        <h1 className="text-3xl font-bold">Your Saved Offers</h1>
      </div>
      
      <SavedOffersList />
    </div>
  );
}