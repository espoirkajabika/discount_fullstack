// components/products/ProductCard.js
'use client'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { brandColors } from '@/lib/colors'
import { textStyles } from '@/lib/typography'

export default function ProductCard({ 
  product, 
  showSaveButton = false,
  compact = false 
}) {
  const { isAuthenticated } = useAuth()
  const [isHovered, setIsHovered] = useState(false)
  const [isSaved, setIsSaved] = useState(false) // TODO: Get from API
  const [loading, setLoading] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isAuthenticated) {
      window.location.href = '/login'
      return
    }

    setLoading(true)
    try {
      // TODO: Implement product save functionality
      setIsSaved(!isSaved)
    } catch (error) {
      console.error('Error saving product:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        backgroundColor: brandColors.white,
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: isHovered ? '0 8px 25px rgba(0,0,0,0.15)' : '0 4px 6px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        cursor: 'pointer',
        border: `1px solid ${brandColors.gray[200]}`,
        position: 'relative'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => window.location.href = `/products/${product.id}`}
    >
      {/* Save Button */}
      {showSaveButton && isAuthenticated && (
        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: isSaved ? brandColors.deepRed : brandColors.white,
            color: isSaved ? brandColors.white : brandColors.gray[600],
            border: `1px solid ${brandColors.gray[300]}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            zIndex: 10,
            transition: 'all 0.2s ease'
          }}
        >
          {loading ? '...' : (isSaved ? '❤️' : '🤍')}
        </button>
      )}

      {/* Product Image */}
      <div style={{
        height: compact ? '140px' : '180px',
        background: product.image_url 
          ? `url(${product.image_url})` 
          : `linear-gradient(135deg, ${brandColors.gray[200]} 0%, ${brandColors.gray[300]} 100%)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        {!product.image_url && (
          <div style={{
            fontSize: '48px',
            color: brandColors.gray[400]
          }}>
            📦
          </div>
        )}

        {/* Category Badge */}
        {product.category && (
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            backgroundColor: brandColors.blackcurrant,
            color: brandColors.white,
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600'
          }}>
            {product.category.name}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: compact ? '16px' : '20px' }}>
        {/* Business Name */}
        {product.business && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '8px',
            gap: '8px'
          }}>
            <span style={{
              ...textStyles.body,
              fontSize: '14px',
              color: brandColors.gray[600]
            }}>
              {product.business.business_name}
            </span>
            {product.business.is_verified && (
              <span style={{
                backgroundColor: brandColors.success,
                color: brandColors.white,
                padding: '2px 6px',
                borderRadius: '8px',
                fontSize: '10px',
                fontWeight: '600'
              }}>
                ✓ Verified
              </span>
            )}
          </div>
        )}

        {/* Product Name */}
        <h3 style={{
          ...textStyles.h4,
          fontSize: compact ? '16px' : '18px',
          marginBottom: '8px',
          lineHeight: '1.3'
        }}>
          {product.name}
        </h3>

        {/* Description */}
        {product.description && !compact && (
          <p style={{
            ...textStyles.body,
            fontSize: '14px',
            color: brandColors.gray[600],
            marginBottom: '12px',
            lineHeight: '1.4',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {product.description}
          </p>
        )}

        {/* Price */}
        {product.price && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'auto'
          }}>
            <span style={{
              fontSize: '20px',
              fontWeight: '700',
              color: brandColors.deepRed
            }}>
              ${product.price}
            </span>

            {/* View Offers Button */}
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.location.href = `/products/${product.id}/offers`
              }}
              style={{
                padding: '6px 12px',
                backgroundColor: brandColors.rosePink,
                color: brandColors.deepRed,
                border: 'none',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              View Offers
            </button>
          </div>
        )}

        {/* Active Status */}
        {!product.is_active && (
          <div style={{
            marginTop: '12px',
            padding: '6px 12px',
            backgroundColor: brandColors.gray[100],
            color: brandColors.gray[600],
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            Currently Unavailable
          </div>
        )}
      </div>
    </div>
  )
}