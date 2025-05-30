// app/offers/trending/page.js - Simple working version
'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { brandColors } from '@/lib/colors'
import { textStyles } from '@/lib/typography'
import api, { endpoints } from '@/lib/api'

// Components
import Navbar from '@/components/layout/Navbar'
import OfferCard from '@/components/offers/OfferCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { FlameKindling } from "lucide-react"

export default function TrendingOffersPage() {
  const { isAuthenticated } = useAuth()
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  const pageSize = 12

  // Load offers on page load
  useEffect(() => {
    loadOffers(1, true)
  }, [])

  const loadOffers = async (pageNum = 1, reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setError(null)
      } else {
        setLoadingMore(true)
      }

      // Get trending offers with pagination
      const response = await api.get(`${endpoints.trendingOffers}?limit=${pageSize}`)
      const offersData = response.data.offers || []

      if (reset) {
        setOffers(offersData)
        setPage(2) // Next page to load
      } else {
        setOffers(prev => [...prev, ...offersData])
        setPage(prev => prev + 1)
      }

      // Check if there are more offers to load
      setHasMore(offersData.length === pageSize)

    } catch (error) {
      console.error('Error loading trending offers:', error)
      setError('Failed to load trending offers. Please try again.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadOffers(page)
    }
  }

  const handleRetry = () => {
    setError(null)
    loadOffers(1, true)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: brandColors.gray[50] }}>
        <Navbar />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh'
        }}>
          <LoadingSpinner size="40px" />
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: brandColors.gray[50] }}>
      <Navbar />
      
      {/* Header */}
      <section style={{
        backgroundColor: brandColors.white,
        borderBottom: `1px solid ${brandColors.gray[200]}`,
        padding: '32px 16px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <div>
              <h4 style={{
                ...textStyles.h4,
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '8px'
              }}>
                <FlameKindling /> Trending Offers
              </h4>
              <p style={{
                ...textStyles.body,
                color: brandColors.gray[600]
              }}>
                Discover the most popular deals that everyone's talking about
              </p>
            </div>
            
            {/* Back Button */}
            <a
              href="/"
              style={{
                padding: '12px 24px',
                backgroundColor: brandColors.gray[200],
                color: brandColors.gray[700],
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
            >
              ← Back to Home
            </a>
          </div>
          
          {/* Stats */}
          <div style={{
            display: 'flex',
            gap: '24px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              padding: '12px 20px',
              backgroundColor: brandColors.deepRed + '10',
              borderRadius: '20px',
              fontSize: '14px',
              color: brandColors.deepRed,
              fontWeight: '600'
            }}>
              {offers.length} Trending Offers
            </div>
            <div style={{
              padding: '12px 20px',
              backgroundColor: brandColors.orange + '10',
              borderRadius: '20px',
              fontSize: '14px',
              color: brandColors.orange,
              fontWeight: '600'
            }}>
              Updated Daily
            </div>
          </div>
        </div>
      </section>

      {/* Error Message */}
      {error && (
        <div style={{
          maxWidth: '1200px',
          margin: '24px auto',
          padding: '16px',
          backgroundColor: `${brandColors.error}10`,
          color: brandColors.error,
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          {error}
          <button
            onClick={handleRetry}
            style={{
              marginLeft: '16px',
              padding: '8px 16px',
              backgroundColor: brandColors.error,
              color: brandColors.white,
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Offers Grid */}
      <section style={{ padding: '32px 16px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {offers.length > 0 ? (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '24px',
                marginBottom: '48px'
              }}>
                {offers.map((offer, index) => (
                  <OfferCard 
                    key={`${offer.id}-${index}`}
                    offer={offer}
                    showSaveButton={isAuthenticated}
                    showClaimButton={isAuthenticated}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div style={{
                  textAlign: 'center',
                  marginBottom: '32px'
                }}>
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    style={{
                      padding: '16px 32px',
                      backgroundColor: loadingMore ? brandColors.gray[400] : brandColors.deepRed,
                      color: brandColors.white,
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: loadingMore ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      margin: '0 auto',
                      minWidth: '160px'
                    }}
                    onMouseEnter={(e) => {
                      if (!loadingMore) {
                        e.target.style.backgroundColor = brandColors.orange
                        e.target.style.transform = 'translateY(-2px)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loadingMore) {
                        e.target.style.backgroundColor = brandColors.deepRed
                        e.target.style.transform = 'translateY(0)'
                      }
                    }}
                  >
                    {loadingMore && (
                      <LoadingSpinner size="20px" color={brandColors.white} />
                    )}
                    {loadingMore ? 'Loading More...' : 'Load More Offers'}
                  </button>
                </div>
              )}

              {/* End of Results */}
              {!hasMore && !loadingMore && offers.length > pageSize && (
                <div style={{
                  textAlign: 'center',
                  padding: '48px',
                  color: brandColors.gray[500]
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    marginBottom: '8px'
                  }}>
                    You've seen all trending offers!
                  </h3>
                  <p>Check back later for new deals.</p>
                  <a
                    href="/offers/expiring"
                    style={{
                      display: 'inline-block',
                      marginTop: '16px',
                      padding: '12px 24px',
                      backgroundColor: brandColors.orange,
                      color: brandColors.white,
                      textDecoration: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    View Expiring Offers
                  </a>
                </div>
              )}
            </>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '80px 20px',
              color: brandColors.gray[500]
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <h3 style={{
                fontSize: '20px',
                marginBottom: '8px',
                color: brandColors.gray[700]
              }}>
                No trending offers found
              </h3>
              <p>Check back later for the latest deals!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}