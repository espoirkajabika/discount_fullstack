'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";

// Icons
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  ChevronDown,
  Tag,
  ArrowUpDown,
  Check
} from 'lucide-react';

export default function FilterMenu({ 
  filters, 
  setFilters, 
  onSearch, 
  onClearFilters, 
  categories, 
  businesses,
  isMobile = false 
}) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState({ ...filters });
  const [priceRange, setPriceRange] = useState(filters.priceRange || [0, 200]);
  
  // Update local filters when main filters change
  useEffect(() => {
    setLocalFilters({ ...filters });
    setPriceRange(filters.priceRange || [0, 200]);
  }, [filters]);

  // Format price range
  const formatPriceRange = (range) => {
    return range.map(price => 
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(price)
    ).join(' - ');
  };

  // Update local filters
  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle search input
  const handleSearchChange = (e) => {
    handleFilterChange('searchTerm', e.target.value);
  };

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    applyFilters();
    
    if (isMobile) {
      setIsOpen(false);
    }
  };

  // Handle price range change
  const handlePriceRangeChange = (value) => {
    setPriceRange(value);
    handleFilterChange('priceRange', value);
  };

  // Apply all filters
  const applyFilters = () => {
    setFilters(localFilters);
    onSearch(localFilters.searchTerm);
    
    // Update URL query params
    const params = new URLSearchParams();
    if (localFilters.searchTerm) params.set('search', localFilters.searchTerm);
    if (localFilters.category && localFilters.category !== 'all') params.set('category', localFilters.category);
    if (localFilters.businessId) params.set('businessId', localFilters.businessId);
    if (localFilters.sortBy) params.set('sortBy', localFilters.sortBy);
    if (localFilters.minDiscount > 0) params.set('minDiscount', localFilters.minDiscount.toString());
    if (localFilters.priceRange && 
        (localFilters.priceRange[0] > 0 || localFilters.priceRange[1] < 200)) {
      params.set('minPrice', localFilters.priceRange[0].toString());
      params.set('maxPrice', localFilters.priceRange[1].toString());
    }
    
    // Update URL without navigation
    const newUrl = `${pathname}?${params.toString()}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
    
    if (isMobile) {
      setIsOpen(false);
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    const defaultFilters = {
      searchTerm: '',
      category: 'all', // Changed from '' to 'all'
      businessId: '',
      sortBy: 'discount_percentage',
      minDiscount: 0,
      priceRange: [0, 200]
    };
    
    setLocalFilters(defaultFilters);
    setPriceRange([0, 200]);
    onClearFilters();
    
    // Clear URL params
    const newUrl = pathname;
    window.history.pushState({ path: newUrl }, '', newUrl);
    
    if (isMobile) {
      setIsOpen(false);
    }
  };

  // Filter content component to maintain DRY
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <form onSubmit={handleSearchSubmit}>
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Search offers..."
              value={localFilters.searchTerm}
              onChange={handleSearchChange}
              className="pl-9 pr-8"
            />
            {localFilters.searchTerm && (
              <button
                type="button"
                onClick={() => handleFilterChange('searchTerm', '')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>
        </form>
      </div>

      <Separator />
      
      {/* Sort */}
      <div className="space-y-2">
        <Label htmlFor="sort">Sort By</Label>
        <Select 
          value={localFilters.sortBy}
          onValueChange={(value) => handleFilterChange('sortBy', value)}
        >
          <SelectTrigger id="sort">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="discount_percentage">Biggest Discount</SelectItem>
            <SelectItem value="expiry_date">Ending Soon</SelectItem>
            <SelectItem value="created_at">Newest</SelectItem>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Separator />
      
      {/* Categories */}
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select 
          value={localFilters.category}
          onValueChange={(value) => handleFilterChange('category', value)}
        >
          <SelectTrigger id="category">
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
      
      {/* Businesses */}
      {businesses && businesses.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="business">Business</Label>
          <Select 
            value={localFilters.businessId}
            onValueChange={(value) => handleFilterChange('businessId', value)}
          >
            <SelectTrigger id="business">
              <SelectValue placeholder="All Businesses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Businesses</SelectItem>
              {businesses.map(business => (
                <SelectItem key={business.id} value={business.id}>
                  {business.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      <Separator />
      
      {/* Min Discount */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="min-discount">Minimum Discount</Label>
          <span className="text-sm font-medium">{localFilters.minDiscount}% off</span>
        </div>
        <Slider
          id="min-discount"
          min={0}
          max={90}
          step={5}
          value={[localFilters.minDiscount]}
          onValueChange={([value]) => handleFilterChange('minDiscount', value)}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0%</span>
          <span>90%+</span>
        </div>
      </div>
      
      {/* Price Range */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="price-range">Price Range</Label>
          <span className="text-sm font-medium">{formatPriceRange(priceRange)}</span>
        </div>
        <Slider
          id="price-range"
          min={0}
          max={200}
          step={5}
          value={priceRange}
          onValueChange={handlePriceRangeChange}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>$0</span>
          <span>$200+</span>
        </div>
      </div>
      
      {/* Include expired offers */}
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="show-expired"
          checked={localFilters.showExpired}
          onCheckedChange={(checked) => handleFilterChange('showExpired', !!checked)}
        />
        <Label htmlFor="show-expired" className="cursor-pointer">
          Include expired offers
        </Label>
      </div>

      {isMobile ? (
        <div className="space-y-3 pt-4">
          <Button onClick={applyFilters} className="w-full">
            Apply Filters
          </Button>
          <Button 
            variant="outline" 
            onClick={handleResetFilters} 
            className="w-full"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="flex space-x-2 pt-4">
          <Button onClick={applyFilters}>
            Apply Filters
          </Button>
          <Button 
            variant="outline" 
            onClick={handleResetFilters}
          >
            Reset
          </Button>
        </div>
      )}
    </div>
  );

  // For mobile view, use Sheet component
  if (isMobile) {
    return (
      <>
        <Button 
          variant="outline" 
          className="flex items-center"
          onClick={() => setIsOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
          {Object.keys(filters).some(key => 
            key !== 'sortBy' && 
            filters[key] && 
            ((Array.isArray(filters[key]) && (filters[key][0] > 0 || filters[key][1] < 200)) || 
            (!Array.isArray(filters[key]) && filters[key] !== '' && filters[key] !== 'all'))
          ) && (
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
              <Check className="h-3 w-3" />
            </span>
          )}
        </Button>
        
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Filters & Sort</SheetTitle>
              <SheetDescription>
                Narrow down offers to find exactly what you're looking for
              </SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // For desktop view, return regular component
  return <FilterContent />;
}