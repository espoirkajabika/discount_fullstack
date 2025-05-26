'use client';

import { useState, useEffect, Fragment, use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Import components
import BusinessCard from '@/app/_components/BusinessCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

// Icons
import { 
  Search, 
  X, 
  Store, 
  SlidersHorizontal,
  AlertCircle,
  RefreshCw,
  MapPin,
  Tag
} from 'lucide-react';

export default function BusinessesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // State variables
  const [businesses, setBusinesses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'all'); // Changed to 'all' instead of ''
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'name');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [totalPages, setTotalPages] = useState(1);
  const [totalBusinesses, setTotalBusinesses] = useState(0);
  const [appliedFilters, setAppliedFilters] = useState([]);
  
  // Categories
  const categories = [
    { value: 'food', label: 'Food & Drink' },
    { value: 'fashion', label: 'Fashion' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'beauty', label: 'Beauty & Health' },
    { value: 'home', label: 'Home & Garden' },
    { value: 'entertainment', label: 'Entertainment' }
  ];

  // Additional filter options
  const offerFilters = [
    { id: 'hasOffers', label: 'Has active offers' },
    { id: 'discountMin30', label: 'Offers with 30%+ discount' }
  ];

  // Location filters (for demo)
  const locationFilters = [
    { id: 'nearby', label: 'Within 5 miles' },
    { id: 'citywide', label: 'Citywide' }
  ];

  // Update URL with current filters
  const updateUrlParams = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (category && category !== 'all') params.set('category', category);
    if (sortBy && sortBy !== 'name') params.set('sortBy', sortBy);
    if (page > 1) params.set('page', page.toString());
    
    // Add any additional filters here
    // ...
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    router.push(newUrl, { scroll: false });
  };

  // Fetch businesses
  useEffect(() => {
    fetchBusinesses();
    
    // Update URL when filters change, but skip on initial load
    if (!isLoading) {
      updateUrlParams();
    }
  }, [searchTerm, category, sortBy, page]);

  // Parse applied filters to display
  useEffect(() => {
    const filters = [];
    
    if (searchTerm) {
      filters.push({ type: 'search', label: `Search: ${searchTerm}`, onRemove: () => setSearchTerm('') });
    }
    
    if (category && category !== 'all') {
      const categoryObj = categories.find(c => c.value === category);
      filters.push({ 
        type: 'category', 
        label: `Category: ${categoryObj?.label || category}`, 
        onRemove: () => setCategory('all') 
      });
    }
    
    // Add other applied filters
    // ...
    
    setAppliedFilters(filters);
  }, [searchTerm, category]);

  const fetchBusinesses = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real app, this would be an API call with proper filters
      // Using the API route we've already set up: /api/customer/businesses
      // For now, we'll simulate a delay and return fake data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate fake businesses
      const fakeBusinesses = Array.from({ length: 20 }, (_, i) => {
        // Create random categories from the list
        const randomCategories = [];
        categories.forEach(category => {
          if (Math.random() > 0.7) {
            randomCategories.push(category.label);
          }
        });
        
        // Ensure at least one category
        if (randomCategories.length === 0) {
          randomCategories.push(categories[Math.floor(Math.random() * categories.length)].label);
        }
        
        // Create the business object
        return {
          id: `business-${i + 1}`,
          business_name: `Business ${i + 1}`,
          business_description: `Description for Business ${i + 1}. We offer great products and services with a focus on customer satisfaction and quality.`,
          business_address: `${100 + i} Main Street, Cityville, State`,
          business_website: Math.random() > 0.3 ? `https://business${i+1}.example.com` : null,
          categories: randomCategories,
          offers_count: Math.floor(Math.random() * 15) + 1,
          avatar: null
        };
      });
      
      // Filter by category if selected
      let filteredBusinesses = fakeBusinesses;
      if (category && category !== 'all') {
        const categoryLabel = categories.find(c => c.value === category)?.label;
        filteredBusinesses = fakeBusinesses.filter(business => 
          business.categories.some(cat => 
            cat.toLowerCase().includes((categoryLabel || category).toLowerCase())
          )
        );
      }
      
      // Filter by search term if entered
      if (searchTerm) {
        filteredBusinesses = filteredBusinesses.filter(business => 
          business.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          business.business_description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Sort businesses
      const sortedBusinesses = [...filteredBusinesses].sort((a, b) => {
        if (sortBy === 'name') {
          return a.business_name.localeCompare(b.business_name);
        } else if (sortBy === 'offers') {
          return b.offers_count - a.offers_count;
        }
        return 0;
      });
      
      // Pagination
      const itemsPerPage = 10;
      const totalItems = sortedBusinesses.length;
      const totalPagesCount = Math.max(1, Math.ceil(totalItems / itemsPerPage));
      
      // Make sure page is valid
      const validPage = Math.min(Math.max(1, page), totalPagesCount);
      if (validPage !== page) {
        setPage(validPage);
      }
      
      // Get current page items
      const startIdx = (validPage - 1) * itemsPerPage;
      const endIdx = startIdx + itemsPerPage;
      const paginatedBusinesses = sortedBusinesses.slice(startIdx, endIdx);
      
      setBusinesses(paginatedBusinesses);
      setTotalPages(totalPagesCount);
      setTotalBusinesses(totalItems);
    } catch (err) {
      console.error('Error fetching businesses:', err);
      setError('Failed to load businesses. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBusinesses();
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
    setPage(1);
  };

  // Clear all filters
  const handleClearAllFilters = () => {
    setSearchTerm('');
    setCategory('all'); // Changed to 'all' instead of ''
    setSortBy('name');
    setPage(1);
  };

  // Handle category filter
  const handleCategoryChange = (value) => {
    setCategory(value);
    setPage(1);
  };

  // Handle sort change
  const handleSortChange = (value) => {
    setSortBy(value);
    setPage(1);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo(0, 0);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Businesses</h1>
          {!isLoading && (
            <p className="text-gray-500 mt-1">
              Showing {businesses.length} of {totalBusinesses} businesses
            </p>
          )}
        </div>
        
        <Button 
          variant="outline" 
          className="md:hidden"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Applied filters */}
      {appliedFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm text-gray-500">Filters:</span>
          {appliedFilters.map((filter, index) => (
            <Badge 
              key={index}
              variant="secondary"
              className="flex items-center gap-1 pl-2"
            >
              {filter.label}
              <button 
                onClick={filter.onRemove}
                className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-500"
            onClick={handleClearAllFilters}
          >
            Clear all
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filters sidebar - desktop */}
        <div className={`md:block ${showMobileFilters ? 'block' : 'hidden'}`}>
          <div className="bg-white rounded-lg border p-4 sticky top-20">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold">Filters</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 md:hidden"
                onClick={() => setShowMobileFilters(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Search input */}
            <div className="mb-4">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search businesses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-8"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </form>
            </div>
            
            {/* Category filter */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-1.5 block">
                Category
              </label>
              <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Sort filter */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-1.5 block">
                Sort By
              </label>
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="offers">Most Offers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Advanced filters */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="offers">
                <AccordionTrigger className="text-sm font-medium">
                  Offers
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {offerFilters.map((filter) => (
                      <div key={filter.id} className="flex items-center space-x-2">
                        <Checkbox id={filter.id} />
                        <label
                          htmlFor={filter.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {filter.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="location">
                <AccordionTrigger className="text-sm font-medium">
                  Location
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {locationFilters.map((filter) => (
                      <div key={filter.id} className="flex items-center space-x-2">
                        <Checkbox id={filter.id} />
                        <label
                          htmlFor={filter.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {filter.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            {/* Action buttons */}
            <div className="mt-6 space-y-2">
              <Button 
                type="button" 
                onClick={handleSearchSubmit} 
                className="w-full"
              >
                Apply Filters
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClearAllFilters} 
                className="w-full"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </div>
        
        {/* Main content - businesses list */}
        <div className="md:col-span-3">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg overflow-hidden border">
                  <div className="p-6">
                    <div className="flex">
                      <Skeleton className="h-20 w-20 rounded-md" />
                      <div className="ml-4 flex-1">
                        <Skeleton className="h-6 w-48 mb-2" />
                        <Skeleton className="h-4 w-full mb-1" />
                        <Skeleton className="h-4 w-3/4 mb-3" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : businesses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border">
              <Store className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">No businesses found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || category !== 'all'
                  ? "Try adjusting your search filters"
                  : "There are no businesses available at this time"}
              </p>
              <Button 
                onClick={handleClearAllFilters}
                className="flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear filters
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {businesses.map((business) => (
                  <BusinessCard key={business.id} business={business} />
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
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(pageNum => {
                          // Show first page, last page, current page, and pages adjacent to current page
                          return pageNum === 1 || 
                                 pageNum === totalPages || 
                                 Math.abs(pageNum - page) <= 1;
                        })
                        .map((pageNum, index, array) => {
                          // Add ellipsis where needed
                          if (index > 0 && array[index - 1] !== pageNum - 1) {
                            return (
                              <Fragment key={`ellipsis-${pageNum}`}>
                                <PaginationItem>
                                  <span className="px-3">...</span>
                                </PaginationItem>
                                <PaginationItem key={pageNum}>
                                  <PaginationLink
                                    isActive={pageNum === page}
                                    onClick={() => handlePageChange(pageNum)}
                                    className="cursor-pointer"
                                  >
                                    {pageNum}
                                  </PaginationLink>
                                </PaginationItem>
                              </Fragment>
                            );
                          }
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                isActive={pageNum === page}
                                onClick={() => handlePageChange(pageNum)}
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                      
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
      </div>
    </div>
  );
}