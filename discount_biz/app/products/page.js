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
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Grid, 
  List, 
  PlusCircle, 
  Search, 
  Tag, 
  SlidersHorizontal,
  X,
  Package,
  Home,
  ArrowLeft,
  Building2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { StorageImage } from '@/components/ui/storage-image';

// Page components
function PageContainer({ children, className = "" }) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 ${className}`}>
      {children}
    </div>
  );
}

function PageHeader({ 
  title, 
  subtitle, 
  backButton = true, 
  backUrl = null,
  backLabel = "Back",
  children 
}) {
  const router = useRouter();

  const handleBack = () => {
    if (backUrl) {
      router.push(backUrl);
    } else {
      router.back();
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top navigation bar with logo */}
        <div className="flex items-center justify-between h-16 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            
            {/* Breadcrumbs */}
            <nav className="flex items-center space-x-2 text-sm">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </button>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium">Products</span>
            </nav>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-green-600"
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>

        {/* Page header */}
        <div className="py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              {backButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="flex-shrink-0 -ml-2 text-gray-600 hover:text-green-600"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  {backLabel}
                </Button>
              )}
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && (
                  <p className="text-gray-600 mt-1">{subtitle}</p>
                )}
              </div>
            </div>

            {children && (
              <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
                {children}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContentContainer({ children, className = "" }) {
  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
      {children}
    </div>
  );
}

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
    limit: 12,
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
    setPagination(prev => ({ ...prev, page: 1 }));
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
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    
    setPagination(prev => ({ ...prev, page: 1 }));
    updateUrlParams({ 
      sortBy: newSortBy, 
      sortOrder: newSortBy === sortBy ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'desc' 
    });
  };

  // Update URL parameters
  const updateUrlParams = (overrides = {}) => {
    const params = new URLSearchParams();
    
    const page = overrides.page !== undefined ? overrides.page : pagination.page;
    const search = overrides.search !== undefined ? overrides.search : searchTerm;
    const newSortBy = overrides.sortBy !== undefined ? overrides.sortBy : sortBy;
    const newSortOrder = overrides.sortOrder !== undefined ? overrides.sortOrder : sortOrder;
    const view = overrides.view !== undefined ? overrides.view : viewMode;
    
    if (page > 1) params.append('page', page);
    if (search) params.append('search', search);
    if (newSortBy !== 'created_at') params.append('sortBy', newSortBy);
    if (newSortOrder !== 'desc') params.append('sortOrder', newSortOrder);
    if (view !== 'grid') params.append('view', view);
    
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.pushState({}, '', newUrl);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    updateUrlParams({ page: newPage });
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
    <div className="text-center py-16">
      <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Package className="h-10 w-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        {searchTerm 
          ? 'Try adjusting your search terms or clearing the search to see all products.' 
          : 'Get started by adding your first product to begin creating offers and attracting customers.'
        }
      </p>
      {searchTerm ? (
        <Button 
          onClick={handleClearSearch}
          variant="outline"
          className="border-green-200 text-green-600 hover:bg-green-50"
        >
          Clear search
        </Button>
      ) : (
        <Button 
          onClick={() => router.push('/products/new')}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Your First Product
        </Button>
      )}
    </div>
  );

  // Loading skeleton component
  const ProductSkeleton = ({ isGrid }) => {
    if (isGrid) {
      return (
        <div className="col-span-1">
          <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
            <div className="aspect-square bg-gray-100 animate-pulse" />
            <div className="p-4">
              <div className="h-4 bg-gray-100 animate-pulse rounded mb-2" />
              <div className="h-6 bg-gray-100 animate-pulse rounded w-1/2 mb-4" />
              <div className="h-4 bg-gray-100 animate-pulse rounded w-1/3" />
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex items-center p-4 border border-gray-200 rounded-xl mb-3 bg-white">
        <div className="w-16 h-16 bg-gray-100 animate-pulse rounded-lg mr-4 flex-shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-gray-100 animate-pulse rounded mb-2 w-1/3" />
          <div className="h-6 bg-gray-100 animate-pulse rounded w-1/4 mb-2" />
          <div className="h-4 bg-gray-100 animate-pulse rounded w-1/2" />
        </div>
      </div>
    );
  };

  // Product card (grid view)
  const ProductCardGrid = ({ product }) => (
    <div 
      className="col-span-1 rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-green-200 transition-all duration-200 cursor-pointer bg-white group"
      onClick={() => router.push(`/products/${product.id}`)}
    >
      <div className="aspect-square bg-gray-50 relative overflow-hidden">
        <StorageImage
          path={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          fallbackSize="400x400"
          emptyIcon={
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-12 w-12 text-gray-300" />
            </div>
          }
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate group-hover:text-green-600 transition-colors">
          {product.name}
        </h3>
        <p className="text-xl font-bold text-green-600 my-2">
          {formatPrice(product.price)}
        </p>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs border-gray-200 text-gray-500">
            ID: {product.id.slice(0, 8)}...
          </Badge>
          <span className="text-xs text-gray-400">
            {new Date(product.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );

  // Product row (list view)
  const ProductRowList = ({ product }) => (
    <div 
      className="flex flex-col sm:flex-row items-start sm:items-center p-4 border border-gray-200 rounded-xl mb-3 hover:shadow-lg hover:border-green-200 transition-all duration-200 cursor-pointer bg-white group"
      onClick={() => router.push(`/products/${product.id}`)}
    >
      <div className="w-full sm:w-20 h-20 rounded-lg bg-gray-50 overflow-hidden mr-4 mb-4 sm:mb-0 flex-shrink-0">
        <StorageImage
          path={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover"
          fallbackSize="80x80"
          emptyIcon={
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-8 w-8 text-gray-300" />
            </div>
          }
        />
      </div>
      <div className="flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
          <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
            {product.name}
          </h3>
          <p className="text-xl font-bold text-green-600 mt-1 sm:mt-0">
            {formatPrice(product.price)}
          </p>
        </div>
        <p className="text-sm text-gray-600 max-w-md line-clamp-2 mb-3">
          {product.description || 'No description provided'}
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs border-gray-200 text-gray-500">
            ID: {product.id.slice(0, 8)}...
          </Badge>
          <Badge variant="outline" className="text-xs border-gray-200 text-gray-500">
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
      <div className="flex items-center justify-between mt-8 p-4 bg-white rounded-xl border border-gray-200">
        <div className="text-sm text-gray-600">
          Showing {(pagination.page - 1) * pagination.limit + 1}
          {pagination.page * pagination.limit < pagination.total 
            ? ` - ${pagination.page * pagination.limit}` 
            : ''} of {pagination.total} products
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="border-gray-200 hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {renderPageNumbers()}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="border-gray-200 hover:bg-gray-50"
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
    const maxVisible = 5;
    
    let startPage = Math.max(1, pagination.page - Math.floor(maxVisible / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <Button
          key={i}
          variant={pagination.page === i ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageChange(i)}
          className={pagination.page === i 
            ? "bg-green-600 hover:bg-green-700 text-white" 
            : "border-gray-200 hover:bg-gray-50"
          }
        >
          {i}
        </Button>
      );
    }
    
    return pageNumbers;
  };

  return (
    <PageContainer>
      <PageHeader
        title="Products"
        subtitle="Manage your business products and create offers"
        backUrl="/dashboard"
        backLabel="Dashboard"
      >
        <Button 
          onClick={() => router.push('/products/new')}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add New Product
        </Button>
      </PageHeader>

      <ContentContainer>
        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-xl text-gray-900">Your Product Catalog</CardTitle>
                <p className="text-gray-600 mt-1">
                  {pagination.total > 0 ? `${pagination.total} products in your catalog` : 'Your product catalog is empty'}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleViewModeChange('grid')}
                    className={`h-8 px-3 ${viewMode === 'grid' 
                      ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm' 
                      : 'hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleViewModeChange('list')}
                    className={`h-8 px-3 ${viewMode === 'list' 
                      ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm' 
                      : 'hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                {/* Sort Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="border-gray-200 hover:bg-gray-50">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Sort
                      {sortBy !== 'created_at' && (
                        <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                          {sortBy.replace('_', ' ')}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem 
                      onClick={() => handleSortChange('created_at')}
                      className="flex items-center justify-between"
                    >
                      Date Added
                      {sortBy === 'created_at' && (
                        <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
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
                        <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
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
                        <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mt-6">
              <form onSubmit={handleSearchSubmit} className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  className="pl-10 pr-10 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                {searchTerm && (
                  <button 
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </form>
            </div>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
      </ContentContainer>
    </PageContainer>
  );
}

export default function ProductsPage() {
  return (
    <BusinessRoute>
      <ProductsContent />
    </BusinessRoute>
  );
}