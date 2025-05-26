'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/CustomerAuthContext';

// Import components
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { StorageImage } from '@/components/ui/storage-image';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { StatusBadge } from '@/app/_components/StatusBadge';

// Icons
import { 
  Ticket, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShoppingBag, 
  RefreshCw,
  ArrowRight,
  Calendar,
  Tag,
  Store
} from 'lucide-react';

export default function ClaimedOffersPage() {
  const router = useRouter();
  const { isLoggedIn, isInitialized } = useAuth();
  
  // State variables
  const [claimedOffers, setClaimedOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOffers, setTotalOffers] = useState(0);
  
  // Redirect if not logged in
  useEffect(() => {
    if (isInitialized && !isLoggedIn) {
      router.push('/customer/auth/login?redirect=/customer/claimed');
    }
  }, [isLoggedIn, isInitialized, router]);
  
  // Fetch claimed offers
  useEffect(() => {
    if (isLoggedIn) {
      fetchClaimedOffers();
    }
  }, [isLoggedIn, page, activeTab]);
  
  // Fetch claimed offers from API
  const fetchClaimedOffers = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Status filter based on active tab
      const statusFilter = activeTab !== 'all' ? `&status=${activeTab}` : '';
      
      // API endpoint with pagination and filters
      const response = await fetch(
        `/api/customer/claimed-offers?page=${page}&limit=6${statusFilter}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch claimed offers');
      }
      
      const data = await response.json();
      
      // Update state with fetched data
      setClaimedOffers(data.claimedOffers || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalOffers(data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching claimed offers:', error);
      setError('Failed to load claimed offers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle page change
  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo(0, 0);
  };
  
  // Handle tab change
  const handleTabChange = (value) => {
    setActiveTab(value);
    setPage(1); // Reset to first page when changing tabs
  };
  
  // Refresh offers list
  const handleRefresh = () => {
    fetchClaimedOffers();
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Format price with currency symbol
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  // Loading state
  if (isLoading && page === 1) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">My Offers</h1>
            <Skeleton className="h-5 w-40" />
          </div>
          
          <Skeleton className="h-10 w-32 mt-4 sm:mt-0" />
        </div>
        
        <Skeleton className="h-12 w-full mb-6" />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">My Offers</h1>
        
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
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">My Offers</h1>
          <p className="text-gray-500">
            Manage and view all your claimed offers
          </p>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          className="mt-4 sm:mt-0"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      {/* Tabs for filtering */}
      <Tabs 
        defaultValue={activeTab} 
        onValueChange={handleTabChange} 
        className="mb-6"
      >
        <TabsList className="w-full grid grid-cols-4 max-w-md">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="redeemed">Redeemed</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Empty state */}
      {claimedOffers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Ticket className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium mb-2">No claimed offers</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {activeTab !== 'all' ? (
              `You don't have any ${activeTab} offers.`
            ) : (
              "You haven't claimed any offers yet. Start exploring available deals!"
            )}
          </p>
          
          <Button asChild>
            <Link href="/customer/offers">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Browse Offers
            </Link>
          </Button>
        </div>
      )}
      
      {/* Claimed offers grid */}
      {claimedOffers.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {claimedOffers.map((claimedOffer) => (
              <Link 
                href={`/customer/claimed/${claimedOffer.id}`}
                key={claimedOffer.id}
                className="block"
              >
                <Card className="h-full hover:shadow-md transition-shadow">
                  <div className="relative">
                    <div className="h-44 bg-gray-100 flex items-center justify-center">
                      <StorageImage
                        path={claimedOffer.offer?.product?.image_url}
                        alt={claimedOffer.offer?.product?.name || 'Product image'}
                        className="w-full h-full object-cover"
                        fallbackSize="300x300"
                        emptyIcon={<Tag className="h-12 w-12 text-gray-300" />}
                      />
                    </div>
                    
                    {/* Status badge */}
                    <div className="absolute top-2 right-2">
                      <StatusBadge status={claimedOffer.status} />
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <Store className="h-3.5 w-3.5 mr-1" />
                      <span className="truncate">
                        {claimedOffer.offer?.business?.business_name}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold mb-2 line-clamp-2">
                      {claimedOffer.offer?.product?.name}
                    </h3>
                    
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                          {claimedOffer.offer?.calculated?.savingsPercentage || 0}% OFF
                        </Badge>
                      </div>
                      
                      {claimedOffer.status === 'active' && (
                        <div className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>
                            Expires {formatDate(claimedOffer.offer?.expiry_date)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 flex items-center">
                      <span className="text-sm line-through text-gray-500 mr-2">
                        {formatPrice(claimedOffer.offer?.calculated?.originalPrice)}
                      </span>
                      <span className="font-bold text-green-600">
                        {formatPrice(claimedOffer.offer?.calculated?.finalPrice)}
                      </span>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="p-4 pt-0 flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      Claimed on {formatDate(claimedOffer.claimed_at)}
                    </div>
                    
                    <div className="text-blue-600 text-sm font-medium flex items-center">
                      View Details
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </div>
                  </CardFooter>
                </Card>
              </Link>
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