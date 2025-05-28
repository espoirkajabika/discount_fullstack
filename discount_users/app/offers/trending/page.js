// app/offers/trending/page.js - Trending offers with infinite scroll
'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { brandColors } from '@/lib/colors'
import { textStyles } from '@/lib/typography'
import api, { endpoints } from '@/lib/api'

// Components
import Navbar from '@/components/layout/Navbar'
import OfferCard from '@/components/offers/OfferCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function TrendingOffersPage() {
  const { isAuthenticated } = useAuth()
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [error, setError] = useState(null)

  const pageSize = 12

  // Load initial offers
  useEffect(() => {
    loadOffers(1, true)
  }, [])

  // Infinite scroll setup
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000 &&
        !loadingMore &&
        hasMore
      ) {
        loadMoreOffers()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadingMore, hasMore])

  const loadOffers = async (pageNum = 1, reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setError(null)
      } else {
        setLoadingMore(true)
      }

      const response = await api.get(`${endpoints.trendingOffers}?limit=${pageSize}&page=${pageNum}`)
      const newOffers = response.data.offers || []

      if (reset) {
        setOffers(newOffers)
      } else {
        setOffers(prev => [...prev, ...newOffers])
      }

      setHasMore(newOffers.length === pageSize)
      setPage(pageNum + 1)

    } catch (error) {
      console.error('Error loading offers:', error)
      setError('Failed to load offers. Please try again.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMoreOffers = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadOffers(page)
    }
  }, [page, loadingMore, hasMore])

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
              <h1 style={{
                ...textStyles.h1,
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '8px'
              }}>
                🔥 Trending Offers
              </h1>
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

              {/* Loading More Indicator */}
              {loadingMore && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '32px'
                }}>
                  <LoadingSpinner size="32px" />
                  <span style={{
                    marginLeft: '12px',
                    color: brandColors.gray[600],
                    fontSize: '16px'
                  }}>
                    Loading more offers...
                  </span>
                </div>
              )}

              {/* End of Results */}
              {!hasMore && !loadingMore && (
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