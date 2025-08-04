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
  Tag,
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
  Calendar,
  Users,
  Pause,
  Play,
  X,
  Clock,
  CheckCircle
} from 'lucide-react'

// Import API functions
import { getOffers, deleteOffer } from '@/lib/offers'
import { getProducts } from '@/lib/products'
import { getImageUrl } from '@/lib/api'

export default function OffersPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  const [offers, setOffers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pagination, setPagination] = useState({})
  const ITEMS_PER_PAGE = 12

  // Offer status calculation
  const getOfferStatus = (offer) => {
    const now = new Date()
    const isActive = offer.is_active === true
    const startDate = new Date(offer.start_date)
    const expiryDate = new Date(offer.expiry_date)
    
    if (!isActive) return 'paused'
    if (startDate > now) return 'scheduled'
    if (expiryDate < now) return 'expired'
    return 'active'
  }

  const getStatusBadge = (status) => {
    const configs = {
      active: { color: 'bg-green-100 text-green-800', label: 'Active', icon: CheckCircle },
      scheduled: { color: 'bg-blue-100 text-blue-800', label: 'Scheduled', icon: Calendar },
      expired: { color: 'bg-gray-100 text-gray-800', label: 'Expired', icon: Clock },
      paused: { color: 'bg-yellow-100 text-yellow-800', label: 'Paused', icon: Pause }
    }
    
    const config = configs[status] || configs.expired
    const Icon = config.icon
    
    return (
      <Badge className={`${config.color} text-xs flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  // Fetch offers data
  const fetchOffers = async () => {
    try {
      setError(null)
      console.log('Fetching offers...')
      
      const params = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        sortBy,
        sortOrder,
      }
      
      if (searchTerm) params.search = searchTerm
      if (selectedProduct) params.product_id = selectedProduct
      if (selectedStatus !== 'all') params.status = selectedStatus
      
      const result = await getOffers(params)
      
      if (result.success) {
        const processedOffers = result.offers.map(offer => ({
          ...offer,
          image_url: getImageUrl(offer.image_url),
          product: offer.product ? {
            ...offer.product,
            image_url: getImageUrl(offer.product.image_url)
          } : undefined,
          status: getOfferStatus(offer)
        }))
        setOffers(processedOffers)
        setPagination(result.pagination || {})
        setTotalPages(result.pagination?.totalPages || 1)
      } else {
        setError(result.error || 'Failed to fetch offers')
      }
    } catch (error) {
      console.error('Error fetching offers:', error)
      setError('Unable to load offers. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Fetch products for filter
  const fetchProducts = async () => {
    try {
      const result = await getProducts({ page: 1, limit: 100 })
      if (result.success) {
        setProducts(result.products || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  useEffect(() => {
    if (user && user.is_business) {
      fetchOffers()
      fetchProducts()
    }
  }, [user, currentPage, searchTerm, selectedProduct, selectedStatus, sortBy, sortOrder])

  const handleRefresh = async () => {
    setRefreshing(true)
    setCurrentPage(1)
    await fetchOffers()
  }

  const handleSearch = (value) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleProductFilter = (value) => {
    setSelectedProduct(value === 'all' ? '' : value)
    setCurrentPage(1)
  }

  const handleStatusFilter = (value) => {
    setSelectedStatus(value)
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

  const handleEdit = (offerId) => {
    router.push(`/business/offers/${offerId}/edit`)
  }

  const handleView = (offerId) => {
    router.push(`/business/offers/${offerId}`)
  }

  const handlePauseResume = async (offerId, isActive) => {
    try {
      const result = isActive ? await pauseOffer(offerId) : await resumeOffer(offerId)
      if (result.success) {
        await fetchOffers() // Refresh the offers list
      } else {
        alert(`Failed to ${isActive ? 'pause' : 'resume'} offer: ` + result.error)
      }
    } catch (error) {
      alert(`Error ${isActive ? 'pausing' : 'resuming'} offer`)
    }
  }

  const handleDelete = async (offerId) => {
    if (window.confirm('Are you sure you want to delete this offer? This action cannot be undone.')) {
      try {
        const result = await deleteOffer(offerId)
        if (result.success) {
          await fetchOffers() // Refresh the offers list
        } else {
          alert('Failed to delete offer: ' + result.error)
        }
      } catch (error) {
        alert('Error deleting offer')
      }
    }
  }

  const handleCreateOffer = () => {
    router.push('/business/offers/new')
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getDiscountDisplay = (offer) => {
    if (offer.discount_type === 'percentage') {
      return `${offer.discount_value}% off`
    } else if (offer.discount_type === 'fixed_amount') {
      return `$${parseFloat(offer.discount_value).toFixed(2)} off`
    } else if (offer.discount_type === 'buy_x_get_y') {
      return `Buy ${offer.buy_quantity} Get ${offer.get_quantity} Free`
    }
    return 'Special Offer'
  }

  if (!user || !user.is_business) {
    return null // BusinessLayout will handle the redirect
  }

  return (
    <BusinessLayout
      title="Offers"
      subtitle="Manage your promotional offers and track performance"
      onRefresh={handleRefresh}
      refreshing={refreshing}
      showRefresh={true}
      activeTab="offers"
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
              placeholder="Search offers..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters and Actions */}
          <div className="flex gap-3 w-full lg:w-auto">
            {/* Product Filter */}
            <Select value={selectedProduct || 'all'} onValueChange={handleProductFilter}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full lg:w-[140px]">
                <Tag className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
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
                <SelectItem value="start_date-desc">Start Date (New)</SelectItem>
                <SelectItem value="start_date-asc">Start Date (Old)</SelectItem>
                <SelectItem value="expiry_date-asc">Expiring Soon</SelectItem>
                <SelectItem value="current_claims-desc">Most Claims</SelectItem>
              </SelectContent>
            </Select>

            {/* Create Offer Button */}
            <Button 
              onClick={handleCreateOffer}
              className="bg-[#e94e1b] hover:bg-[#d13f16] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Offer
            </Button>
          </div>
        </div>
      </div>

      {/* Offers Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#e94e1b]" />
          <span className="ml-2 text-gray-600">Loading offers...</span>
        </div>
      ) : offers.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {offers.map((offer) => (
              <Card key={offer.id} className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-0">
                  {/* Offer Image */}
                  <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                    {offer.image_url || offer.product?.image_url ? (
                      <img 
                        src={offer.image_url || offer.product?.image_url} 
                        alt={offer.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Tag className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Discount Badge */}
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-[#e94e1b] text-white font-bold">
                        {getDiscountDisplay(offer)}
                      </Badge>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-2 right-12">
                      {getStatusBadge(offer.status)}
                    </div>
                    
                    {/* Actions Dropdown */}
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="sm" className="h-8 w-8 p-0 bg-white/90 hover:bg-white">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(offer.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(offer.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Offer
                          </DropdownMenuItem>
                          {offer.status === 'active' || offer.status === 'scheduled' ? (
                            <DropdownMenuItem onClick={() => handlePauseResume(offer.id, true)}>
                              <Pause className="h-4 w-4 mr-2" />
                              Pause Offer
                            </DropdownMenuItem>
                          ) : offer.status === 'paused' ? (
                            <DropdownMenuItem onClick={() => handlePauseResume(offer.id, false)}>
                              <Play className="h-4 w-4 mr-2" />
                              Resume Offer
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem 
                            onClick={() => handleDelete(offer.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Offer Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{offer.title}</h3>
                    </div>
                    
                    {offer.product && (
                      <p className="text-sm text-gray-600 mb-2">
                        Product: {offer.product.name}
                      </p>
                    )}

                    {offer.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {offer.description}
                      </p>
                    )}

                    {/* Offer Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Start Date:</span>
                        <span className="font-medium">{formatDate(offer.start_date)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">End Date:</span>
                        <span className="font-medium">{formatDate(offer.expiry_date)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Claims:</span>
                        <span className="font-medium">
                          {offer.current_claims || 0}
                          {offer.max_claims ? ` / ${offer.max_claims}` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleView(offer.id)}
                        className="flex-1 text-xs border-[#e94e1b] text-[#e94e1b] hover:bg-[#e94e1b] hover:text-white"
                      >
                        View Details
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleEdit(offer.id)}
                        className="flex-1 text-xs bg-[#e94e1b] hover:bg-[#d13f16] text-white"
                      >
                        Edit
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
          <Tag className="h-16 w-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm || selectedProduct || selectedStatus !== 'all' ? 'No offers found' : 'No offers yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || selectedProduct || selectedStatus !== 'all'
              ? 'Try adjusting your search or filters' 
              : 'Create your first promotional offer to start attracting customers!'
            }
          </p>
          <Button onClick={handleCreateOffer} className="bg-[#e94e1b] hover:bg-[#d13f16] text-white">
            <Plus className="h-4 w-4 mr-2" />
            Create your first offer
          </Button>
        </div>
      )}
    </BusinessLayout>
  )
}