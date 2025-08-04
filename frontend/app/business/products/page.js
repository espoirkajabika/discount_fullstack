'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import BusinessLayout from '@/components/BusinessLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  ShoppingBag,
  Plus,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash,
  Eye,
  TrendingUp,
  Package
} from 'lucide-react'

// Import API functions
import { getProducts, deleteProduct, getCategories } from '@/lib/products'
import { getImageUrl } from '@/lib/api'

export default function ProductsPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [businessName, setBusinessName] = useState('')
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pagination, setPagination] = useState({})
  const ITEMS_PER_PAGE = 12

  // Fetch products data
  const fetchProducts = async () => {
    try {
      setError(null)
      console.log('Fetching products...')
      
      const params = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        sortBy,
        sortOrder,
      }
      
      if (searchTerm) params.search = searchTerm
      if (selectedCategory) params.category_id = selectedCategory
      
      const result = await getProducts(params)
      
      if (result.success) {
        const processedProducts = result.products.map(product => ({
          ...product,
          image_url: getImageUrl(product.image_url)
        }))
        setProducts(processedProducts)
        setPagination(result.pagination || {})
        setTotalPages(result.pagination?.totalPages || 1)
        
        // Get business name from first product if available
        if (processedProducts.length > 0 && processedProducts[0].business) {
          setBusinessName(processedProducts[0].business.business_name || '')
        }
      } else {
        setError(result.error || 'Failed to fetch products')
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setError('Unable to load products. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const result = await getCategories()
      if (result.success) {
        setCategories(result.categories || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  useEffect(() => {
    if (user && user.is_business) {
      fetchProducts()
      fetchCategories()
    }
  }, [user, currentPage, searchTerm, selectedCategory, sortBy, sortOrder])

  const handleRefresh = async () => {
    setRefreshing(true)
    setCurrentPage(1)
    await fetchProducts()
  }

  const handleSearch = (value) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleCategoryFilter = (value) => {
    setSelectedCategory(value === 'all' ? '' : value)
    setCurrentPage(1)
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
    setCurrentPage(1)
  }

  const handleViewOffers = (productId) => {
    router.push(`/business/products/${productId}/offers`)
  }

  const handleEdit = (productId) => {
    router.push(`/business/products/${productId}/edit`)
  }

  const handleCreateOffer = (productId) => {
    router.push(`/business/offers/new?product_id=${productId}`)
  }

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        const result = await deleteProduct(productId)
        if (result.success) {
          await fetchProducts() // Refresh the products list
        } else {
          alert('Failed to delete product: ' + result.error)
        }
      } catch (error) {
        alert('Error deleting product')
      }
    }
  }

  const handleNewProduct = () => {
    router.push('/business/products/new')
  }

  if (!user || !user.is_business) {
    return null // BusinessLayout will handle the redirect
  }

  return (
    <BusinessLayout
      title="Products"
      subtitle="Manage your product catalog and create offers"
      onRefresh={handleRefresh}
      refreshing={refreshing}
      showRefresh={true}
      activeTab="products"
    >
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Header with Search and Filters */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters and Actions */}
          <div className="flex gap-3 w-full lg:w-auto">
            {/* Category Filter */}
            <Select value={selectedCategory || 'all'} onValueChange={handleCategoryFilter}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-')
              setSortBy(field)
              setSortOrder(order)
              setCurrentPage(1)
            }}>
              <SelectTrigger className="w-full lg:w-[140px]">
                <TrendingUp className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at-desc">Newest First</SelectItem>
                <SelectItem value="created_at-asc">Oldest First</SelectItem>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
                <SelectItem value="price-desc">Price High-Low</SelectItem>
                <SelectItem value="price-asc">Price Low-High</SelectItem>
              </SelectContent>
            </Select>

            {/* New Product Button */}
            <Button 
              onClick={handleNewProduct}
              className="bg-[#e94e1b] hover:bg-[#d13f16] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Product
            </Button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#e94e1b]" />
          <span className="ml-2 text-gray-600">Loading products...</span>
        </div>
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {products.map((product) => (
              <Card key={product.id} className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-0">
                  {/* Product Image */}
                  <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Actions Dropdown */}
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="sm" className="h-8 w-8 p-0 bg-white/90 hover:bg-white">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewOffers(product.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Offers
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCreateOffer(product.id)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Offer
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(product.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Product
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" className="text-xs">
                        {product.categories?.name || product.category?.name || 'Uncategorized'}
                      </Badge>
                      {product.price && (
                        <span className="text-lg font-bold text-[#e94e1b]">
                          ${parseFloat(product.price).toFixed(2)}
                        </span>
                      )}
                    </div>

                    {product.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewOffers(product.id)}
                        className="flex-1 text-xs border-[#e94e1b] text-[#e94e1b] hover:bg-[#e94e1b] hover:text-white"
                      >
                        View Offers
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleCreateOffer(product.id)}
                        className="flex-1 text-xs bg-[#e94e1b] hover:bg-[#d13f16] text-white"
                      >
                        Create Offer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <span className="text-sm text-gray-600 px-4">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm || selectedCategory ? 'No products found' : 'No products yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || selectedCategory 
              ? 'Try adjusting your search or filters' 
              : 'Add your first product to start creating offers and managing your inventory!'
            }
          </p>
          <Button onClick={handleNewProduct} className="bg-[#e94e1b] hover:bg-[#d13f16] text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add your first product
          </Button>
        </div>
      )}
    </BusinessLayout>
  )
}