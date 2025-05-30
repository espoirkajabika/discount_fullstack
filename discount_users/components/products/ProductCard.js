// components/products/ProductCard.js - Updated with better image handling
'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { brandColors } from '@/lib/colors'
import { textStyles } from '@/lib/typography'
import { getImageUrl } from '@/lib/api'

export default function ProductCard({ 
  product, 
  showSaveButton = false,
  compact = false 
}) {
  const { isAuthenticated } = useAuth()
  const [isHovered, setIsHovered] = useState(false)
  const [isSaved, setIsSaved] = useState(false) // TODO: Implement product save functionality
  const [loading, setLoading] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isAuthenticated) {
      window.location.href = '/login'
      return
    }

    setLoading(true)
    try {
      // TODO: Implement product save functionality when API endpoint is available
      setIsSaved(!isSaved)
    } catch (error) {
      console.error('Error saving product:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get the product image URL with better handling
  const getProductImageUrl = () => {
    // Check multiple possible image sources
    if (product.image_url) return product.image_url
    if (product.imageUrl) return product.imageUrl
    if (product.avatar_url) return product.avatar_url
    
    // If no direct image URL, try to construct from path
    if (product.image_path) return getImageUrl(product.image_path)
    
    return null
  }

  const imageUrl = getProductImageUrl()

  // Handle image load error
  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <div
      style={{
        backgroundColor: brandColors.white,
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: isHovered ? '0 6px 20px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        cursor: 'pointer',
        border: `1px solid ${brandColors.gray[200]}`,
        position: 'relative',
        maxWidth: '300px',
        opacity: product.is_active === false ? 0.7 : 1
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
            top: '8px',
            right: '8px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: isSaved ? brandColors.deepRed : brandColors.white,
            color: isSaved ? brandColors.white : brandColors.gray[600],
            border: `1px solid ${brandColors.gray[300]}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            zIndex: 10,
            transition: 'all 0.2s ease'
          }}
        >
          {loading ? '...' : (isSaved ? '❤️' : '🤍')}
        </button>
      )}

      {/* Product Image */}
      <div style={{
        height: compact ? '120px' : '140px',
        background: imageUrl && !imageError
          ? `url(${imageUrl})` 
          : `linear-gradient(135deg, ${brandColors.gray[200]} 0%, ${brandColors.gray[300]} 100%)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        {/* Hidden image to detect load errors */}
        {imageUrl && (
          <img 
            src={imageUrl} 
            onError={handleImageError}
            style={{ display: 'none' }}
            alt=""
          />
        )}

        {/* Fallback icon when no image */}
        {(!imageUrl || imageError) && (
          <div style={{
            fontSize: '32px',
            color: brandColors.gray[400]
          }}>
            📦
          </div>
        )}

        {/* Image indicator */}
        {imageUrl && !imageError && (
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            backgroundColor: 'rgba(0,0,0,0.5)',
            color: brandColors.white,
            padding: '2px 6px',
            borderRadius: '8px',
            fontSize: '10px',
            fontWeight: '600'
          }}>
            📷
          </div>
        )}

        {/* Category Badge */}
        {(product.category || product.categories) && (
          <div style={{
            position: 'absolute',
            bottom: '8px',
            left: '8px',
            backgroundColor: brandColors.blackcurrant,
            color: brandColors.white,
            padding: '3px 6px',
            borderRadius: '10px',
            fontSize: '10px',
            fontWeight: '600'
          }}>
            {product.category?.name || product.categories?.name}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: compact ? '12px' : '16px' }}>
        {/* Business Name */}
        {(product.business || product.businesses) && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '6px',
            gap: '6px'
          }}>
            <span style={{
              ...textStyles.body,
              fontSize: '12px',
              color: brandColors.gray[600]
            }}>
              {product.business?.business_name || product.businesses?.business_name}
            </span>
            {(product.business?.is_verified || product.businesses?.is_verified) && (
              <span style={{
                backgroundColor: brandColors.success,
                color: brandColors.white,
                padding: '1px 4px',
                borderRadius: '6px',
                fontSize: '9px',
                fontWeight: '600'
              }}>
                ✓
              </span>
            )}
          </div>
        )}

        {/* Product Name */}
        <h3 style={{
          ...textStyles.h4,
          fontSize: compact ? '14px' : '16px',
          marginBottom: '6px',
          lineHeight: '1.3',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {product.name}
        </h3>

        {/* Description */}
        {product.description && !compact && (
          <p style={{
            ...textStyles.body,
            fontSize: '13px',
            color: brandColors.gray[600],
            marginBottom: '10px',
            lineHeight: '1.3',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {product.description}
          </p>
        )}

        {/* Price and Actions */}
        {product.price && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'auto'
          }}>
            <span style={{
              fontSize: compact ? '16px' : '18px',
              fontWeight: '700',
              color: brandColors.deepRed
            }}>
              ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
            </span>

            {/* View Offers Button */}
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.location.href = `/products/${product.id}/offers`
              }}
              style={{
                padding: '4px 8px',
                backgroundColor: brandColors.rosePink,
                color: brandColors.deepRed,
                border: 'none',
                borderRadius: '12px',
                fontSize: '11px',
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
        {product.is_active === false && (
          <div style={{
            marginTop: '8px',
            padding: '4px 8px',
            backgroundColor: brandColors.gray[100],
            color: brandColors.gray[600],
            borderRadius: '6px',
            fontSize: '11px',
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