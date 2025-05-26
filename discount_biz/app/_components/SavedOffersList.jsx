'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/CustomerAuthContext';

// Import components
import OfferCard from '@/app/_components/OfferCard';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Icons
import { 
  Heart, 
  ShoppingBag,
  RefreshCw,
  AlertCircle,
  Clock,
  Filter
} from 'lucide-react';

export default function SavedOffersList() {
  const { isLoggedIn, customer } = useAuth();
  
  // State variables
  const [savedOffers, setSavedOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showExpired, setShowExpired] = useState(false);
  const [totalOffers, setTotalOffers] = useState(0);
  
  // Fetch saved offers
  useEffect(() => {
    if (isLoggedIn) {
      fetchSavedOffers();
    }
  }, [isLoggedIn, page, showExpired]);
  
  // Fetch saved offers from API
  const fetchSavedOffers = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // API endpoint with pagination and filters
      const response = await fetch(
        `/api/customer/saved-offers?page=${page}&limit=6&showExpired=${showExpired}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch saved offers');
      }
      
      const data = await response.json();
      
      setSavedOffers(data.savedOffers || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalOffers(data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching saved offers:', error);
      setError('Failed to load saved offers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle page change
  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo(0, 0);
  };
  
  // Handle toggle expired offers
  const handleToggleExpired = () => {
    setShowExpired(!showExpired);
    setPage(1); // Reset to first page when changing filters
  };
  
  // Handle offer unsave
  const handleOfferRemoved = (offerId) => {
    // Filter out the removed offer
    setSavedOffers(prev => prev.filter(offer => offer.id !== offerId));
    
    // Decrement total offers count
    setTotalOffers(prev => Math.max(0, prev - 1));
    
    // Adjust total pages if needed
    const newTotalPages = Math.max(1, Math.ceil((totalOffers - 1) / 6));
    setTotalPages(newTotalPages);
    
    // If current page is now beyond total pages, go to last page
    if (page > newTotalPages) {
      setPage(newTotalPages);
    }
    
    // If we removed the last offer on this page and there are more pages, go to previous page
    if (savedOffers.length === 1 && page > 1) {
      setPage(page - 1);
    }
  };
  
  // Refresh offers list
  const handleRefresh = () => {
    fetchSavedOffers();
  };
  
  // Loading state
  if (isLoading && page === 1) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-8 w-48" />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg overflow-hidden">
              <Skeleton className="h-44 w-full" />
              <div className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-5 w-40 mb-3" />
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          className="mt-2"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </Alert>
    );
  }
  
  // Empty state
  if (savedOffers.length === 0) {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Saved Offers <span className="text-gray-500">({totalOffers})</span>
          </h2>
          
          <div className="flex items-center">
            <div className="flex items-center mr-4">
              <Checkbox 
                id="show-expired" 
                checked={showExpired} 
                onCheckedChange={handleToggleExpired}
              />
              <Label htmlFor="show-expired" className="ml-2">
                Show expired offers
              </Label>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
        
        <div className="text-center py-12 bg-white rounded-lg border">
          <Heart className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium mb-2">No saved offers</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {showExpired 
              ? "You haven't saved any offers yet. Browse our available offers and save your favorites!"
              : "You don't have any active saved offers. Would you like to see expired offers as well?"}
          </p>
          
          {!showExpired ? (
            <Button onClick={handleToggleExpired}>
              <Clock className="mr-2 h-4 w-4" />
              Show Expired Offers
            </Button>
          ) : (
            <Button asChild>
              <Link href="/customer/offers">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Browse Offers
              </Link>
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  // Show offers
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold">
          Saved Offers <span className="text-gray-500">({totalOffers})</span>
        </h2>
        
        <div className="flex items-center">
          <div className="flex items-center mr-4">
            <Checkbox 
              id="show-expired" 
              checked={showExpired} 
              onCheckedChange={handleToggleExpired}
            />
            <Label htmlFor="show-expired" className="ml-2">
              Show expired offers
            </Label>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedOffers.map((offer) => (
              <OfferCard 
                key={offer.id} 
                offer={offer.offer} 
                onRemove={() => handleOfferRemoved(offer.id)}
              />
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(Math.max(1, page - 1))}
                      className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        isActive={pageNum === page}
                        onClick={() => handlePageChange(pageNum)}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                      className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
}