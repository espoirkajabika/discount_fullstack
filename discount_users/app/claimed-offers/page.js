// app/claimed-offers/page.js - Complete version with QR Code integration
'use client'
import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/ui/SimpleToast'
import { apiHelpers, claimUtils } from '@/lib/api'
import api from '@/lib/api'
import { brandColors } from '@/lib/colors'
import { textStyles } from '@/lib/typography'
import Navbar from '@/components/layout/Navbar'
import QRCodeDisplay from '@/components/claims/QRCodeDisplay'

// Individual Claim Card Component with Image Support
function ClaimCard({ claim, status, offer, formatDate, toast, onViewQRCode }) {
  const [productImage, setProductImage] = useState(null)
  const [imageError, setImageError] = useState(false)

  // Fetch product image using the same logic as OfferCard
  useEffect(() => {
    const fetchProductImage = async () => {
      if (offer?.product_id) {
        try {
          // Use the existing product search endpoint that works
          const response = await api.get(
            `/customer/search/products?page=1&size=50`
          );
          const products = response.data.products || [];

          // Find the product with matching ID
          const product = products.find((p) => p.id === offer.product_id);
          if (product?.image_url) {
            let imageUrl = product.image_url;

            // Ensure we have the full URL
            if (!imageUrl.startsWith("http")) {
              imageUrl = `https://lwwhsiaqvkjtlqaxkads.supabase.co/storage/v1/object/public/product-images/${imageUrl}`;
            }
            setProductImage(imageUrl);
          }
        } catch (error) {
          console.error("Error fetching product image for claim:", error);
        }
      }
    };

    fetchProductImage();
  }, [offer?.product_id]);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div
      style={{
        backgroundColor: brandColors.white,
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: `1px solid ${brandColors.gray[200]}`,
        transition: 'all 0.2s ease',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.12)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
      }}
    >
      {/* Product Image Header */}
      <div
        style={{
          height: '120px',
          ...(productImage && !imageError
            ? {
                backgroundImage: `url(${productImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }
            : {
                backgroundImage: `linear-gradient(135deg, ${brandColors.deepRed} 0%, ${brandColors.orange} 100%)`,
              }),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        {/* Hidden image to detect load errors */}
        {productImage && (
          <img
            src={productImage}
            onError={handleImageError}
            onLoad={() => console.log("Claim image loaded:", productImage)}
            style={{ display: 'none' }}
            alt=""
          />
        )}

        {/* Status Badge Overlay */}
        <div style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          backgroundColor: status.color,
          color: brandColors.white,
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
          <span>{status.icon}</span>
          {status.label}
        </div>

        {/* Claim Type Badge */}
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: brandColors.white,
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '10px',
          fontWeight: '600',
          textTransform: 'uppercase'
        }}>
          {claimUtils.formatClaimType(claim.claim_type)}
        </div>

        {/* Discount Badge */}
        {offer?.discount_value && (
          <div style={{
            backgroundColor: brandColors.white,
            color: brandColors.deepRed,
            padding: '6px 12px',
            borderRadius: '16px',
            fontSize: '16px',
            fontWeight: '700',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            ${offer.discount_value} OFF
          </div>
        )}
      </div>

      {/* Card Content */}
      <div style={{ padding: '20px' }}>
        {/* Offer Details */}
        <h3 style={{
          ...textStyles.h4,
          fontSize: '18px',
          marginBottom: '8px',
          lineHeight: '1.3'
        }}>
          {offer?.title || 'Offer Title'}
        </h3>

        <p style={{
          ...textStyles.body,
          fontSize: '14px',
          color: brandColors.gray[600],
          marginBottom: '12px'
        }}>
          {offer?.businesses?.business_name || 
           offer?.business?.business_name || 
           'Business Name'}
        </p>

        {/* Price Info */}
        {offer?.original_price && offer?.discounted_price && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: brandColors.gray[50],
            borderRadius: '8px'
          }}>
            <div>
              <span style={{
                fontSize: '12px',
                color: brandColors.gray[500]
              }}>
                Original: 
              </span>
              <span style={{
                textDecoration: 'line-through',
                color: brandColors.gray[500],
                marginLeft: '4px'
              }}>
                ${offer.original_price}
              </span>
            </div>
            <div>
              <span style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: brandColors.deepRed
              }}>
                ${offer.discounted_price}
              </span>
            </div>
          </div>
        )}

        {/* Claim Info */}
        <div style={{
          borderTop: `1px solid ${brandColors.gray[200]}`,
          paddingTop: '16px',
          fontSize: '14px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <span style={{ color: brandColors.gray[600] }}>Claim ID:</span>
            <span style={{
              fontFamily: 'monospace',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {claim.unique_claim_id}
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <span style={{ color: brandColors.gray[600] }}>Claimed:</span>
            <span>{formatDate(claim.claimed_at)}</span>
          </div>

          {claim.is_redeemed && claim.redeemed_at && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span style={{ color: brandColors.gray[600] }}>Redeemed:</span>
              <span>{formatDate(claim.redeemed_at)}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div style={{ marginTop: '16px' }}>
          {claim.claim_type === 'in_store' && !claim.is_redeemed ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onViewQRCode(claim)
              }}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: brandColors.deepRed,
                color: brandColors.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              📱 View QR Code
            </button>
          ) : claim.claim_type === 'online' && claim.merchant_redirect_url ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                window.open(claim.merchant_redirect_url, '_blank')
              }}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#3B82F6',
                color: brandColors.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              🌐 Visit Website
            </button>
          ) : (
            <div style={{
              width: '100%',
              padding: '12px',
              backgroundColor: brandColors.gray[100],
              color: brandColors.gray[600],
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              {claim.is_redeemed ? '✅ Completed' : '📋 No Action Needed'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ClaimedOffersPage() {
  const { isAuthenticated, user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  
  const [claimedOffers, setClaimedOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    size: 12
  })

  // Filter and Search States
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all, redeemed, pending
  const [claimTypeFilter, setClaimTypeFilter] = useState('all') // all, in_store, online
  const [sortBy, setSortBy] = useState('claimed_at') // claimed_at, redeemed_at, offer_title
  const [sortOrder, setSortOrder] = useState('desc') // asc, desc
  const [showFilters, setShowFilters] = useState(false)

  // QR Code Modal States
  const [selectedClaim, setSelectedClaim] = useState(null)
  const [showQRCode, setShowQRCode] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.warning('Please log in to view your claimed offers')
      setTimeout(() => {
        window.location.href = '/login'
      }, 1500)
    }
  }, [authLoading, isAuthenticated, toast])

  // Load claimed offers
  useEffect(() => {
    if (isAuthenticated) {
      loadClaimedOffers()
    }
  }, [isAuthenticated])

  const loadClaimedOffers = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = {
        page: 1, // Always start from page 1 when filters change
        size: 100, // Get more records to handle client-side filtering
        ...(statusFilter !== 'all' && { redeemed_only: statusFilter === 'redeemed' }),
        ...(claimTypeFilter !== 'all' && { claim_type: claimTypeFilter })
      }

      const result = await apiHelpers.getClaimedOffers(params)
      
      if (result.success) {
        setClaimedOffers(result.data.claimed_offers || [])
        setPagination(prev => ({
          ...prev,
          page: 1, // Reset to first page
          total: result.data.total || 0
        }))
      } else {
        setError(result.error)
        toast.error('Failed to load claimed offers')
      }
    } catch (error) {
      console.error('Error loading claimed offers:', error)
      setError('Something went wrong. Please try again.')
      toast.error('Failed to load claimed offers')
    } finally {
      setLoading(false)
    }
  }

  // Handle QR Code viewing
  const handleViewQRCode = (claim) => {
    setSelectedClaim(claim)
    setShowQRCode(true)
  }

  const handleQRCodeSuccess = (qrData) => {
    console.log('QR code loaded successfully:', qrData)
  }

  // Filtered and sorted claims (client-side processing)
  const filteredAndSortedClaims = useMemo(() => {
    let filtered = [...claimedOffers]

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(claim => {
        const offer = claim.offer || {}
        const business = offer.businesses || offer.business || {}
        
        return (
          offer.title?.toLowerCase().includes(searchLower) ||
          business.business_name?.toLowerCase().includes(searchLower) ||
          claim.unique_claim_id?.toLowerCase().includes(searchLower) ||
          offer.description?.toLowerCase().includes(searchLower)
        )
      })
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'redeemed') {
        filtered = filtered.filter(claim => claim.is_redeemed)
      } else if (statusFilter === 'pending') {
        filtered = filtered.filter(claim => !claim.is_redeemed)
      }
    }

    // Apply claim type filter
    if (claimTypeFilter !== 'all') {
      filtered = filtered.filter(claim => claim.claim_type === claimTypeFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case 'claimed_at':
          aValue = new Date(a.claimed_at)
          bValue = new Date(b.claimed_at)
          break
        case 'redeemed_at':
          aValue = a.redeemed_at ? new Date(a.redeemed_at) : new Date(0)
          bValue = b.redeemed_at ? new Date(b.redeemed_at) : new Date(0)
          break
        case 'offer_title':
          aValue = a.offer?.title || ''
          bValue = b.offer?.title || ''
          break
        case 'business_name':
          aValue = a.offer?.businesses?.business_name || a.offer?.business?.business_name || ''
          bValue = b.offer?.businesses?.business_name || b.offer?.business?.business_name || ''
          break
        default:
          aValue = a.claimed_at
          bValue = b.claimed_at
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [claimedOffers, searchTerm, statusFilter, claimTypeFilter, sortBy, sortOrder])

  // Paginated claims for display
  const paginatedClaims = useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.size
    const endIndex = startIndex + pagination.size
    return filteredAndSortedClaims.slice(startIndex, endIndex)
  }, [filteredAndSortedClaims, pagination.page, pagination.size])

  // Update pagination when filtered results change
  useEffect(() => {
    const totalPages = Math.ceil(filteredAndSortedClaims.length / pagination.size)
    setPagination(prev => ({
      ...prev,
      totalPages,
      total: filteredAndSortedClaims.length
    }))
  }, [filteredAndSortedClaims, pagination.size])

  // Handle retry
  const handleRetry = () => {
    loadClaimedOffers()
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setClaimTypeFilter('all')
    setSortBy('claimed_at')
    setSortOrder('desc')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get status display for claim
  const getClaimStatus = (claim) => {
    if (claim.is_redeemed) {
      return {
        label: 'Redeemed',
        color: brandColors.success || '#10B981',
        icon: '✅',
        bgColor: `${brandColors.success || '#10B981'}15`
      }
    }
    
    if (claim.claim_type === 'online') {
      return {
        label: 'Pending Online',
        color: '#3B82F6',
        icon: '🌐',
        bgColor: '#3B82F615'
      }
    }
    
    return {
      label: 'Ready for Pickup',
      color: brandColors.orange,
      icon: '🏪',
      bgColor: `${brandColors.orange}15`
    }
  }

  // Handle page change
  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }))
    }
  }

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (searchTerm.trim()) count++
    if (statusFilter !== 'all') count++
    if (claimTypeFilter !== 'all') count++
    if (sortBy !== 'claimed_at' || sortOrder !== 'desc') count++
    return count
  }, [searchTerm, statusFilter, claimTypeFilter, sortBy, sortOrder])

  // If still checking auth, show loading
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: brandColors.gray[50] }}>
        <Navbar />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh'
        }}>
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  // If not authenticated, show nothing (redirect is happening)
  if (!isAuthenticated) {
    return null
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: brandColors.gray[50] }}>
      <Navbar />
      
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '32px 16px'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            ...textStyles.h2,
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            🎫 My Claimed Offers
            {activeFilterCount > 0 && (
              <span style={{
                backgroundColor: brandColors.deepRed,
                color: brandColors.white,
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
              </span>
            )}
          </h1>
          <p style={{
            ...textStyles.body,
            color: brandColors.gray[600]
          }}>
            View and manage all your claimed offers
          </p>
        </div>

        {/* Search and Filters */}
        <div style={{
          backgroundColor: brandColors.white,
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          marginBottom: '32px'
        }}>
          {/* Search Bar */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '20px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '16px',
                color: brandColors.gray[400]
              }}>
                🔍
              </span>
              <input
                type="text"
                placeholder="Search offers, businesses, or claim IDs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: `1px solid ${brandColors.gray[300]}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = brandColors.deepRed
                  e.target.style.boxShadow = `0 0 0 3px ${brandColors.deepRed}20`
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = brandColors.gray[300]
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                padding: '12px 20px',
                backgroundColor: showFilters ? brandColors.deepRed : brandColors.white,
                color: showFilters ? brandColors.white : brandColors.gray[700],
                border: `1px solid ${showFilters ? brandColors.deepRed : brandColors.gray[300]}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              🔧 Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                style={{
                  padding: '12px 20px',
                  backgroundColor: brandColors.gray[100],
                  color: brandColors.gray[700],
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                ✕ Clear All
              </button>
            )}
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              paddingTop: '20px',
              borderTop: `1px solid ${brandColors.gray[200]}`
            }}>
              {/* Status Filter */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: brandColors.gray[700]
                }}>
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${brandColors.gray[300]}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: brandColors.white,
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="redeemed">Redeemed</option>
                </select>
              </div>

              {/* Claim Type Filter */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: brandColors.gray[700]
                }}>
                  Claim Type
                </label>
                <select
                  value={claimTypeFilter}
                  onChange={(e) => setClaimTypeFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${brandColors.gray[300]}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: brandColors.white,
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">All Types</option>
                  <option value="in_store">In-Store</option>
                  <option value="online">Online</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: brandColors.gray[700]
                }}>
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${brandColors.gray[300]}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: brandColors.white,
                    cursor: 'pointer'
                  }}
                >
                  <option value="claimed_at">Date Claimed</option>
                  <option value="redeemed_at">Date Redeemed</option>
                  <option value="offer_title">Offer Title</option>
                  <option value="business_name">Business Name</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: brandColors.gray[700]
                }}>
                  Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${brandColors.gray[300]}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: brandColors.white,
                    cursor: 'pointer'
                  }}
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        {!loading && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            padding: '16px 0'
          }}>
            <div style={{
              fontSize: '14px',
              color: brandColors.gray[600]
            }}>
              Showing {paginatedClaims.length} of {filteredAndSortedClaims.length} claims
              {searchTerm && ` for "${searchTerm}"`}
            </div>
            
            {filteredAndSortedClaims.length > 0 && (
              <div style={{
                fontSize: '14px',
                color: brandColors.gray[600]
              }}>
                Page {pagination.page} of {pagination.totalPages}
              </div>
            )}
          </div>
        )}

        {/* Stats Summary */}
        {claimedOffers.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}>
            <div style={{
              backgroundColor: brandColors.white,
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: brandColors.deepRed,
                marginBottom: '4px'
              }}>
                {filteredAndSortedClaims.length}
              </div>
              <div style={{
                fontSize: '14px',
                color: brandColors.gray[600]
              }}>
                {searchTerm || activeFilterCount > 0 ? 'Filtered' : 'Total'} Claims
              </div>
            </div>

            <div style={{
              backgroundColor: brandColors.white,
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: brandColors.success || '#10B981',
                marginBottom: '4px'
              }}>
                {filteredAndSortedClaims.filter(c => c.is_redeemed).length}
              </div>
              <div style={{
                fontSize: '14px',
                color: brandColors.gray[600]
              }}>
                Redeemed
              </div>
            </div>

            <div style={{
              backgroundColor: brandColors.white,
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: brandColors.orange,
                marginBottom: '4px'
              }}>
                {filteredAndSortedClaims.filter(c => !c.is_redeemed).length}
              </div>
              <div style={{
                fontSize: '14px',
                color: brandColors.gray[600]
              }}>
                Pending
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '300px',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div className="loading-spinner"></div>
            <p style={{ color: brandColors.gray[600] }}>Loading your claimed offers...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div style={{
            backgroundColor: brandColors.white,
            padding: '48px',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{
              ...textStyles.h4,
              marginBottom: '8px',
              color: brandColors.error
            }}>
              Something went wrong
            </h3>
            <p style={{
              ...textStyles.body,
              marginBottom: '24px',
              color: brandColors.gray[600]
            }}>
              {error}
            </p>
            <button
              onClick={handleRetry}
              style={{
                padding: '12px 24px',
                backgroundColor: brandColors.deepRed,
                color: brandColors.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* No Results State */}
        {!loading && !error && filteredAndSortedClaims.length === 0 && claimedOffers.length > 0 && (
          <div style={{
            backgroundColor: brandColors.white,
            padding: '48px',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</div>
            <h3 style={{
              ...textStyles.h3,
              marginBottom: '8px'
            }}>
              No claims match your filters
            </h3>
            <p style={{
              ...textStyles.body,
              marginBottom: '24px',
              color: brandColors.gray[600]
            }}>
              Try adjusting your search or filter criteria.
            </p>
            <button
              onClick={clearFilters}
              style={{
                padding: '12px 24px',
                backgroundColor: brandColors.deepRed,
                color: brandColors.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* No Claims State */}
        {!loading && !error && claimedOffers.length === 0 && (
          <div style={{
            backgroundColor: brandColors.white,
            padding: '48px',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎫</div>
            <h3 style={{
              ...textStyles.h3,
              marginBottom: '8px'
            }}>
              No Claimed Offers Yet
            </h3>
            <p style={{
              ...textStyles.body,
              marginBottom: '24px',
              color: brandColors.gray[600]
            }}>
              You haven't claimed any offers yet. Start browsing to find great deals!
            </p>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                padding: '16px 32px',
                backgroundColor: brandColors.deepRed,
                color: brandColors.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Browse Offers
            </button>
          </div>
        )}

        {/* Claims Grid */}
        {!loading && !error && paginatedClaims.length > 0 && (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '24px',
              marginBottom: '48px'
            }}>
              {paginatedClaims.map((claim) => {
                const status = getClaimStatus(claim)
                const offer = claim.offer

                return (
                  <ClaimCard 
                    key={claim.id} 
                    claim={claim} 
                    status={status} 
                    offer={offer}
                    formatDate={formatDate}
                    toast={toast}
                    onViewQRCode={handleViewQRCode}
                  />
                )
              })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                marginTop: '32px'
              }}>
                <button
                  onClick={() => changePage(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: pagination.page <= 1 ? brandColors.gray[300] : brandColors.white,
                    color: pagination.page <= 1 ? brandColors.gray[500] : brandColors.gray[700],
                    border: `1px solid ${brandColors.gray[300]}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  ← Previous
                </button>

                <span style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  color: brandColors.gray[600]
                }}>
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <button
                  onClick={() => changePage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: pagination.page >= pagination.totalPages ? brandColors.gray[300] : brandColors.white,
                    color: pagination.page >= pagination.totalPages ? brandColors.gray[500] : brandColors.gray[700],
                    border: `1px solid ${brandColors.gray[300]}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* QR Code Modal */}
      <QRCodeDisplay
        isOpen={showQRCode}
        onClose={() => setShowQRCode(false)}
        claim={selectedClaim}
        onQRCodeLoad={handleQRCodeSuccess}
      />
    </div>
  )
}