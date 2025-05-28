// app/page.js
'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { brandColors } from '@/lib/colors'
import { textStyles } from '@/lib/typography'
import api, { endpoints } from '@/lib/api'

// Components
import OfferCard from '@/components/offers/OfferCard'
import ProductCard from '@/components/products/ProductCard'
import CategoryCard from '@/components/categories/CategoryCard'
import SearchBar from '@/components/search/SearchBar'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

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
      
      // Load all data concurrently
      const [categoriesRes, trendingRes, expiringRes, productsRes] = await Promise.all([
        api.get(endpoints.categories),
        api.get(endpoints.trendingOffers + '?limit=6'),
        api.get(endpoints.expiringOffers + '?hours=48&limit=4'),
        api.get(endpoints.searchProducts + '?page=1&size=8')
      ])

      setData({
        categories: categoriesRes.data || [],
        trendingOffers: trendingRes.data.offers || [],
        expiringOffers: expiringRes.data.offers || [],
        featuredProducts: productsRes.data.products || [],
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
      {/* Header/Navigation */}
      <header style={{
        backgroundColor: brandColors.white,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{
            ...textStyles.h3,
            background: `linear-gradient(135deg, ${brandColors.deepRed} 0%, ${brandColors.orange} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: 0
          }}>
            Discount Deals
          </h1>
          
          <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <a href="/browse" style={{ ...textStyles.link, textDecoration: 'none' }}>
              Browse
            </a>
            <a href="/categories" style={{ ...textStyles.link, textDecoration: 'none' }}>
              Categories
            </a>
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <a href="/saved" style={{ ...textStyles.link, textDecoration: 'none' }}>
                  Saved
                </a>
                <a href="/profile" style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: brandColors.deepRed,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: brandColors.white,
                  fontSize: '14px',
                  fontWeight: 'bold',
                  textDecoration: 'none'
                }}>
                  👤
                </a>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '12px' }}>
                <a
                  href="/login"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    color: brandColors.deepRed,
                    border: `1px solid ${brandColors.deepRed}`,
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Login
                </a>
                <a
                  href="/register"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: brandColors.deepRed,
                    color: brandColors.white,
                    border: 'none',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Sign Up
                </a>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        background: `linear-gradient(135deg, ${brandColors.rosePink}20 0%, ${brandColors.white} 100%)`,
        padding: '60px 16px'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <h1 style={{
            ...textStyles.h1,
            marginBottom: '16px',
            background: `linear-gradient(135deg, ${brandColors.deepRed} 0%, ${brandColors.orange} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Find Amazing Local Deals
          </h1>
          <p style={{
            ...textStyles.bodyLarge,
            marginBottom: '32px',
            maxWidth: '600px',
            margin: '0 auto 32px'
          }}>
            Discover exclusive discounts from local businesses in your area
          </p>
          
          <SearchBar placeholder="Search offers, restaurants, shops..." />
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
        {/* Categories Section */}
        <section style={{ padding: '48px 0' }}>
          <h2 style={{ ...textStyles.h2, textAlign: 'center', marginBottom: '32px' }}>
            Browse by Category
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
        </section>

        {/* Trending Offers Section */}
        <section style={{ padding: '48px 0' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px'
          }}>
            <h2 style={textStyles.h2}>🔥 Trending Offers</h2>
            <a
              href="/offers/trending"
              style={{
                ...textStyles.link,
                textDecoration: 'none',
                fontSize: '16px'
              }}
            >
              View All →
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
        <section style={{ padding: '48px 0' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px'
          }}>
            <h2 style={textStyles.h2}>⏰ Expiring Soon</h2>
            <a
              href="/offers/expiring"
              style={{
                ...textStyles.link,
                textDecoration: 'none',
                fontSize: '16px'
              }}
            >
              View All →
            </a>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
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
        </section>

        {/* Featured Products Section */}
        <section style={{ padding: '48px 0' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px'
          }}>
            <h2 style={textStyles.h2}>✨ Featured Products</h2>
            <a
              href="/products"
              style={{
                ...textStyles.link,
                textDecoration: 'none',
                fontSize: '16px'
              }}
            >
              View All →
            </a>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px'
          }}>
            {data.featuredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product}
                showSaveButton={isAuthenticated}
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

        {/* Call to Action Section */}
        <section style={{
          padding: '60px 0',
          textAlign: 'center',
          background: `linear-gradient(135deg, ${brandColors.deepRed} 0%, ${brandColors.orange} 100%)`,
          borderRadius: '12px',
          margin: '48px 0',
          color: brandColors.white
        }}>
          <h2 style={{
            ...textStyles.h2,
            color: brandColors.white,
            marginBottom: '16px'
          }}>
            Ready to Start Saving?
          </h2>
          <p style={{
            ...textStyles.bodyLarge,
            color: brandColors.white,
            marginBottom: '32px',
            opacity: 0.9
          }}>
            {isAuthenticated 
              ? "Explore more offers and start claiming your favorites!"
              : "Sign up now to save offers and claim exclusive deals!"
            }
          </p>
          
          {isAuthenticated ? (
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <a
                href="/offers/trending"
                style={{
                  padding: '14px 28px',
                  backgroundColor: brandColors.white,
                  color: brandColors.deepRed,
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '16px'
                }}
              >
                Browse All Offers
              </a>
              <a
                href="/saved"
                style={{
                  padding: '14px 28px',
                  backgroundColor: 'transparent',
                  color: brandColors.white,
                  border: `2px solid ${brandColors.white}`,
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '16px'
                }}
              >
                View Saved Offers
              </a>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <a
                href="/register"
                style={{
                  padding: '14px 28px',
                  backgroundColor: brandColors.white,
                  color: brandColors.deepRed,
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '16px'
                }}
              >
                Sign Up Free
              </a>
              <a
                href="/login"
                style={{
                  padding: '14px 28px',
                  backgroundColor: 'transparent',
                  color: brandColors.white,
                  border: `2px solid ${brandColors.white}`,
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '16px'
                }}
              >
                Login
              </a>
            </div>
          )}
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