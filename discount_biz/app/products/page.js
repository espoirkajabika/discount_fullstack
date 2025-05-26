'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getProducts } from '@/lib/products';
import { useAuth } from '@/context/AuthContext';
import { BusinessRoute } from '@/components/ProtectedRoute';

// Import components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChevronLeft, 
  ChevronRight, 
  Grid, 
  List, 
  PlusCircle, 
  Search, 
  Tag, 
  SlidersHorizontal,
  X 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { StorageImage } from '@/components/ui/storage-image';

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State variables
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Initialize from search params
  useEffect(() => {
    const page = parseInt(searchParams.get('page')) || 1;
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const viewMode = searchParams.get('view') || 'grid';
    
    setPagination(prev => ({ ...prev, page }));
    setSearchTerm(search);
    setSortBy(sortBy);
    setSortOrder(sortOrder);
    setViewMode(viewMode);
  }, [searchParams]);

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, [pagination.page, searchTerm, sortBy, sortOrder]);

  // Fetch products from API
  const fetchProducts = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sortBy,
        sortOrder: sortOrder,
      };
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const result = await getProducts(params);
      
      if (result.error) {
        setError(result.error);
        return;
      }
      
      setProducts(result.products);
      setPagination(prev => ({
        ...prev,
        ...result.pagination
      }));
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to fetch products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 on new search
    updateUrlParams();
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 1 }));
    updateUrlParams({ search: '' });
  };

  // Handle sort change
  const handleSortChange = (newSortBy) => {
    // If clicking on the same field, toggle order
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to descending for new sort field
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 on sort change
    updateUrlParams({ 
      sortBy: newSortBy, 
      sortOrder: newSortBy === sortBy ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'desc' 
    });
  };

  // Update URL parameters
  const updateUrlParams = (overrides = {}) => {
    const params = new URLSearchParams();
    
    // Current values
    const page = overrides.page !== undefined ? overrides.page : pagination.page;
    const search = overrides.search !== undefined ? overrides.search : searchTerm;
    const newSortBy = overrides.sortBy !== undefined ? overrides.sortBy : sortBy;
    const newSortOrder = overrides.sortOrder !== undefined ? overrides.sortOrder : sortOrder;
    const view = overrides.view !== undefined ? overrides.view : viewMode;
    
    // Only add params that have values
    if (page > 1) params.append('page', page);
    if (search) params.append('search', search);
    if (newSortBy !== 'created_at') params.append('sortBy', newSortBy);
    if (newSortOrder !== 'desc') params.append('sortOrder', newSortOrder);
    if (view !== 'grid') params.append('view', view);
    
    // Update URL without reloading the page
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.pushState({}, '', newUrl);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    updateUrlParams({ page: newPage });
    
    // Scroll to top of the page
    window.scrollTo(0, 0);
  };

  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    updateUrlParams({ view: mode });
  };

  // Format currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Empty state component
  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <Tag className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">No products found</h3>
      <p className="text-muted-foreground mb-6">
        {searchTerm ? 'Try adjusting your search or filters' : 'Get started by creating your first product'}
      </p>
      {searchTerm ? (
        <Button onClick={handleClearSearch}>Clear search</Button>
      ) : (
        <Button onClick={() => router.push('/products/new')}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      )}
    </div>
  );

  // Loading skeleton component
  const ProductSkeleton = ({ isGrid }) => {
    if (isGrid) {
      return (
        <div className="col-span-1">
          <div className="rounded-lg border overflow-hidden">
            <div className="aspect-square bg-muted animate-pulse" />
            <div className="p-4">
              <div className="h-4 bg-muted animate-pulse rounded mb-2" />
              <div className="h-6 bg-muted animate-pulse rounded w-1/2 mb-4" />
              <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex items-center p-4 border rounded-lg mb-3">
        <div className="w-16 h-16 bg-muted animate-pulse rounded-md mr-4 flex-shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-muted animate-pulse rounded mb-2 w-1/3" />
          <div className="h-6 bg-muted animate-pulse rounded w-1/4 mb-2" />
          <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
        </div>
      </div>
    );
  };

  // Product card (grid view)
  const ProductCardGrid = ({ product }) => (
    <div 
      className="col-span-1 rounded-lg border overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => router.push(`/products/${product.id}`)}
    >
      <div className="aspect-square bg-gray-100 relative">
        <StorageImage
          path={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover"
          fallbackSize="400x400"
          emptyIcon={<Tag className="h-12 w-12 text-gray-300" />}
        />
      </div>
      <div className="p-4">
        <h3 className="font-medium truncate">{product.name}</h3>
        <p className="text-lg font-bold text-blue-600 my-1">
          {formatPrice(product.price)}
        </p>
        <p className="text-xs text-gray-500">
          ID: {product.id.slice(0, 8)}...
        </p>
      </div>
    </div>
  );

  // Product row (list view)
  const ProductRowList = ({ product }) => (
    <div 
      className="flex flex-col sm:flex-row items-start sm:items-center p-4 border rounded-lg mb-3 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => router.push(`/products/${product.id}`)}
    >
      <div className="w-full sm:w-20 h-20 rounded bg-gray-100 overflow-hidden mr-4 mb-4 sm:mb-0 flex-shrink-0">
        <StorageImage
          path={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover"
          fallbackSize="80x80"
          emptyIcon={<Tag className="h-8 w-8 text-gray-300" />}
        />
      </div>
      <div className="flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
          <h3 className="font-medium">{product.name}</h3>
          <p className="text-lg font-bold text-blue-600">
            {formatPrice(product.price)}
          </p>
        </div>
        <p className="text-sm text-gray-500 max-w-md line-clamp-1">
          {product.description || 'No description provided'}
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline" className="text-xs">
            ID: {product.id.slice(0, 8)}...
          </Badge>
          <Badge variant="outline" className="text-xs">
            Added: {new Date(product.created_at).toLocaleDateString()}
          </Badge>
        </div>
      </div>
    </div>
  );

  // Render pagination controls
  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;
    
    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-muted-foreground">
          Showing {(pagination.page - 1) * pagination.limit + 1}
          {pagination.page * pagination.limit < pagination.total 
            ? ` - ${pagination.page * pagination.limit}` 
            : ''} of {pagination.total} products
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {renderPageNumbers()}
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // Render page numbers
  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxVisible = 5; // Maximum number of page buttons to show
    
    let startPage = Math.max(1, pagination.page - Math.floor(maxVisible / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);
    
    // Adjust start if we're near the end
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <Button
          key={i}
          variant={pagination.page === i ? "default" : "outline"}
          size="icon"
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      );
    }
    
    return pageNumbers;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your business products and offers
          </p>
        </div>
        <Button 
          onClick={() => router.push('/products/new')}
          className="w-full md:w-auto"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add New Product
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Your Products</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => handleViewModeChange('grid')}
                title="Grid view"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => handleViewModeChange('list')}
                title="List view"
              >
                <List className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-auto" size="sm">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Sort
                    {sortBy !== 'created_at' && (
                      <Badge variant="secondary" className="ml-2 capitalize">
                        {sortBy.replace('_', ' ')}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => handleSortChange('created_at')}
                    className="flex items-center justify-between"
                  >
                    Date Added
                    {sortBy === 'created_at' && (
                      <Badge variant="secondary" className="ml-2">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleSortChange('name')}
                    className="flex items-center justify-between"
                  >
                    Name
                    {sortBy === 'name' && (
                      <Badge variant="secondary" className="ml-2">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleSortChange('price')}
                    className="flex items-center justify-between"
                  >
                    Price
                    {sortBy === 'price' && (
                      <Badge variant="secondary" className="ml-2">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mt-4">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-10 pr-10"
                value={searchTerm}
                onChange={handleSearchChange}
              />
              {searchTerm && (
                <button 
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </form>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, index) => (
                  <ProductSkeleton key={index} isGrid={true} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {[...Array(5)].map((_, index) => (
                  <ProductSkeleton key={index} isGrid={false} />
                ))}
              </div>
            )
          ) : products.length === 0 ? (
            <EmptyState />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map(product => (
                <ProductCardGrid key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {products.map(product => (
                <ProductRowList key={product.id} product={product} />
              ))}
            </div>
          )}

          {!isLoading && products.length > 0 && renderPagination()}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <BusinessRoute>
      <ProductsContent />
    </BusinessRoute>
  );
}