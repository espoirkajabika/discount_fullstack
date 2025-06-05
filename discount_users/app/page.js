// app/page.js - Updated with proper image fetching
'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { brandColors } from '@/lib/colors'
import { textStyles } from '@/lib/typography'
import api, { endpoints, apiHelpers } from '@/lib/api'

// Components
import Navbar from '@/components/layout/Navbar'
import BannerCarousel from '@/components/layout/BannerCarousel'
import SearchBar from '@/components/search/SearchBar'
import OfferCard from '@/components/offers/OfferCard'
import ProductCard from '@/components/products/ProductCard'
import CategoryCard from '@/components/categories/CategoryCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { ChartNoAxesCombined, ShieldAlert, Megaphone } from 'lucide-react'

export default function Home() {
  const { isAuthenticated } = useAuth()
  const [data, setData] = useState({
    categories: [],
    trendingOffers: [],
    expiringOffers: [],
    featuredProducts: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    loadHomeData()
    
  }, [])

  const loadHomeData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }))
      
      // Load all data concurrently using the new API helpers
      const [categoriesRes, trendingRes, expiringRes, productsRes] = await Promise.all([
        api.get(endpoints.categories),
        apiHelpers.getTrendingOffers(6),
        apiHelpers.getExpiringOffers(48, 6),
        apiHelpers.getProducts({ page: 1, size: 6 })
      ])
      setData({
        categories: categoriesRes.data || [],
        trendingOffers: trendingRes.offers || [],
        expiringOffers: expiringRes.offers || [],
        featuredProducts: productsRes.products || [],
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('Error loading home data:', error)
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load data. Please try again.'
      }))
    }
  }

  if (data.loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: brandColors.gray[50]
      }}>
        <LoadingSpinner size="40px" />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: brandColors.gray[50] }}>
      {/* Navigation */}
      <Navbar />

      {/* Banner Carousel */}
      <BannerCarousel />

      {/* Search Section */}
      <section style={{
        padding: '32px 16px',
        backgroundColor: brandColors.white,
        borderBottom: `1px solid ${brandColors.gray[200]}`
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <SearchBar placeholder="Search for deals, products, or businesses..." />
        </div>
      </section>

      {/* Error Message */}
      {data.error && (
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '16px',
          backgroundColor: `${brandColors.error}10`,
          color: brandColors.error,
          borderRadius: '8px',
          marginBottom: '32px',
          textAlign: 'center'
        }}>
          {data.error}
          <button
            onClick={loadHomeData}
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

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
        {/* Trending Offers Section */}
        <section style={{ 
          padding: '48px 0',
          backgroundColor: brandColors.gray[50]
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px'
          }}>
            <h2 style={{
              ...textStyles.h4,
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <ChartNoAxesCombined /> Trending Offers
            </h2>
            <a
              href="/offers/trending"
              style={{
                padding: '12px 24px',
                backgroundColor: brandColors.orange,
                color: brandColors.white,
                textDecoration: 'none',
                borderRadius: '24px',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              View More →
            </a>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {data.trendingOffers.map(offer => (
              <OfferCard 
                key={offer.id} 
                offer={offer}
                showSaveButton={isAuthenticated}
                showClaimButton={isAuthenticated}
              />
            ))}
          </div>
          
          {data.trendingOffers.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '48px',
              color: brandColors.gray[500]
            }}>
              No trending offers available at the moment.
            </div>
          )}
        </section>

        {/* Expiring Soon Section */}
        <section style={{ 
          padding: '48px 0',
          backgroundColor: brandColors.white,
          borderRadius: '12px',
          margin: '24px 0'
        }}>
          <div style={{ padding: '0 24px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '32px'
            }}>
              <h2 style={{
                ...textStyles.h4,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <ShieldAlert /> Expiring Soon
              </h2>
              <a
                href="/offers/expiring"
                style={{
                  padding: '12px 24px',
                  backgroundColor: brandColors.orange,
                  color: brandColors.white,
                  textDecoration: 'none',
                  borderRadius: '24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                View More →
              </a>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              {data.expiringOffers.map(offer => (
                <OfferCard 
                  key={offer.id} 
                  offer={offer}
                  showSaveButton={isAuthenticated}
                  showClaimButton={isAuthenticated}
                  urgent={true}
                />
              ))}
            </div>
            
            {data.expiringOffers.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '48px',
                color: brandColors.gray[500]
              }}>
                No offers expiring soon.
              </div>
            )}
          </div>
        </section>

        {/* Featured Products Section */}
        <section style={{ 
          padding: '48px 0',
          backgroundColor: brandColors.gray[50]
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px'
          }}>
            <h2 style={{
              ...textStyles.h4,
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <Megaphone /> Featured Products
            </h2>
            <a
              href="/products"
              style={{
                padding: '12px 24px',
                backgroundColor: brandColors.orange,
                color: brandColors.white,
                textDecoration: 'none',
                borderRadius: '24px',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              View More →
            </a>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px'
          }}>
            {data.featuredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product}
                showSaveButton={isAuthenticated}
                compact={true}
              />
            ))}
          </div>
          
          {data.featuredProducts.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '48px',
              color: brandColors.gray[500]
            }}>
              No featured products available.
            </div>
          )}
        </section>

        {/* Browse by Categories Section */}
        <section style={{ 
          padding: '48px 0',
          backgroundColor: brandColors.white,
          borderRadius: '12px',
          margin: '24px 0'
        }}>
          <div style={{ padding: '0 24px' }}>
            <h2 style={{
              ...textStyles.h2,
              textAlign: 'center',
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}>
              🗂️ Browse by Category
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '24px'
            }}>
              {data.categories.map(category => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer style={{
        backgroundColor: brandColors.blackcurrant,
        color: brandColors.white,
        padding: '48px 16px 24px',
        marginTop: '64px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <h3 style={{
            ...textStyles.h3,
            color: brandColors.white,
            marginBottom: '16px'
          }}>
            Discount Deals
          </h3>
          <p style={{
            ...textStyles.body,
            color: brandColors.white,
            opacity: 0.8,
            marginBottom: '32px'
          }}>
            Connecting you with amazing local deals and discounts
          </p>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '32px',
            marginBottom: '24px',
            flexWrap: 'wrap'
          }}>
            <a href="/about" style={{ color: brandColors.white, textDecoration: 'none' }}>
              About
            </a>
            <a href="/contact" style={{ color: brandColors.white, textDecoration: 'none' }}>
              Contact
            </a>
            <a href="/terms" style={{ color: brandColors.white, textDecoration: 'none' }}>
              Terms
            </a>
            <a href="/privacy" style={{ color: brandColors.white, textDecoration: 'none' }}>
              Privacy
            </a>
          </div>
          
          <p style={{
            fontSize: '14px',
            opacity: 0.6,
            margin: 0
          }}>
            © 2024 Discount Deals. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
