'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/CustomerAuthContext';

// Import components
import OfferCard from '../../_components/OfferCard';
import FilterMenu from '../../_components/FilterMenu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Icons
import { 
  Search, 
  SlidersHorizontal, 
  Tag, 
  X, 
  ChevronDown
} from 'lucide-react';

export default function OffersPage() {
  const searchParams = useSearchParams();
  const { isLoggedIn } = useAuth();
  
  // State variables
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState('discount_percentage');
  const [category, setCategory] = useState(searchParams.get('category') || 'all'); // Changed from '' to 'all'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filtersVisible, setFiltersVisible] = useState(false);
  
  // Categories data for filter
  const categoriesData = [
    { value: 'food', label: 'Food & Drink' },
    { value: 'fashion', label: 'Fashion' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'beauty', label: 'Beauty & Health' },
    { value: 'home', label: 'Home & Garden' },
    { value: 'entertainment', label: 'Entertainment' }
  ];
  
  // Filter state for FilterMenu
  const [filters, setFilters] = useState({
    searchTerm: searchTerm,
    category: category,
    sortBy: sortBy,
    minDiscount: 0,
    priceRange: [0, 200],
    showExpired: false
  });

  // Fetch offers when params change
  useEffect(() => {
    fetchOffers();
  }, [searchParams, sortBy, page]);

  // Fake data for initial implementation
  const fetchOffers = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate fake offers data
      const fakeOffers = Array.from({ length: 12 }, (_, i) => ({
        id: `${i + 1}`,
        discount_percentage: Math.floor(Math.random() * 50) + 10,
        discount_code: Math.random() > 0.5 ? `SAVE${Math.floor(Math.random() * 100)}` : null,
        start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        expiry_date: new Date(Date.now() + (Math.floor(Math.random() * 30) + 1) * 24 * 60 * 60 * 1000).toISOString(),
        products: {
          name: `Product ${i + 1}`,
          price: (Math.random() * 100 + 10).toFixed(2),
          image_url: null,
        },
        business: {
          business_name: `Business ${Math.floor(i / 3) + 1}`
        },
        calculated: {
          originalPrice: (Math.random() * 100 + 10).toFixed(2),
        },
        user: {
          isSaved: Math.random() > 0.8 && isLoggedIn,
          isClaimed: Math.random() > 0.9 && isLoggedIn
        }
      }));
      
      // Apply filters
      let filteredOffers = fakeOffers;
      
      // Filter by search term
      if (searchTerm) {
        filteredOffers = filteredOffers.filter(offer =>
          offer.products.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          offer.business.business_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Filter by category (if selected)
      if (category && category !== 'all') { // Changed from '' to 'all'
        // In a real application, you would have proper category data
        // For the demo, we'll just filter randomly based on the category
        filteredOffers = filteredOffers.filter(() => Math.random() > 0.3);
      }
      
      // Sort offers
      if (sortBy === 'discount_percentage') {
        filteredOffers.sort((a, b) => b.discount_percentage - a.discount_percentage);
      } else if (sortBy === 'expiry_date') {
        filteredOffers.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
      } else if (sortBy === 'created_at') {
        // Fake created_at for demo
        filteredOffers.sort(() => Math.random() - 0.5);
      } else if (sortBy === 'price_asc') {
        filteredOffers.sort((a, b) => parseFloat(a.calculated.originalPrice) - parseFloat(b.calculated.originalPrice));
      } else if (sortBy === 'price_desc') {
        filteredOffers.sort((a, b) => parseFloat(b.calculated.originalPrice) - parseFloat(a.calculated.originalPrice));
      }
      
      setOffers(filteredOffers);
      setTotalPages(3); // Fake pagination
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search submit
  const handleSearchSubmit = (term) => {
    setSearchTerm(term);
    setPage(1);
    fetchOffers();
  };

  // Clear search
  const handleClearFilters = () => {
    setSearchTerm('');
    setCategory('all'); // Changed from '' to 'all'
    setSortBy('discount_percentage');
    setPage(1);
    setFilters({
      searchTerm: '',
      category: 'all', // Changed from '' to 'all'
      sortBy: 'discount_percentage',
      minDiscount: 0,
      priceRange: [0, 200],
      showExpired: false
    });
    fetchOffers();
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo(0, 0);
  };
  
  // Handle filter change
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setSearchTerm(newFilters.searchTerm);
    setCategory(newFilters.category);
    setSortBy(newFilters.sortBy);
    setPage(1);
    fetchOffers();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">All Offers</h1>
        
        <Button 
          variant="outline" 
          className="md:hidden"
          onClick={() => setFiltersVisible(!filtersVisible)}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar filters - always visible on desktop, toggleable on mobile */}
        <div className={`w-full md:w-64 ${filtersVisible ? 'block' : 'hidden md:block'}`}>
          <div className="bg-white rounded-lg border p-4">
            <h2 className="font-medium mb-3">Filters</h2>
            
            <FilterMenu 
              filters={filters}
              setFilters={handleFilterChange}
              onSearch={handleSearchSubmit}
              onClearFilters={handleClearFilters}
              categories={categoriesData}
              businesses={[]} // You can populate this with actual business data if available
            />
          </div>
        </div>
        
        {/* Main content - offers grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
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
          ) : offers.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border">
              <Tag className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">No offers found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || category !== 'all' // Changed from '' to 'all'
                  ? "Try adjusting your search filters"
                  : "There are no active offers at this time"}
              </p>
              <Button onClick={handleClearFilters}>Clear filters</Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {offers.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </div>
              
              {/* Pagination */}
              <div className="mt-8 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(Math.max(1, page - 1))}
                        className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          isActive={pageNum === page}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                        className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}