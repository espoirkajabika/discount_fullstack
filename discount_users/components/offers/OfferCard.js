// components/offers/OfferCard.js - Updated with smaller size and fixed images
'use client'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { brandColors } from '@/lib/colors'
import { textStyles } from '@/lib/typography'
import api, { endpoints } from '@/lib/api'

export default function OfferCard({ 
  offer, 
  showSaveButton = false, 
  showClaimButton = false,
  urgent = false,
  compact = false 
}) {
  const { isAuthenticated } = useAuth()
  const [isHovered, setIsHovered] = useState(false)
  const [isSaved, setIsSaved] = useState(false) // TODO: Get from API
  const [loading, setLoading] = useState(false)
  
  // Calculate time remaining
  const getTimeRemaining = () => {
    const now = new Date()
    const expiry = new Date(offer.expiry_date)
    const diff = expiry - now
    
    if (diff <= 0) return 'Expired'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} left`
    return 'Expires soon'
  }

  // Calculate availability
  const getAvailability = () => {
    if (!offer.max_claims) return null
    const remaining = offer.max_claims - offer.current_claims
    if (remaining <= 0) return 'Sold out'
    if (remaining <= 5) return `Only ${remaining} left`
    return null
  }

  const handleSave = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isAuthenticated) {
      window.location.href = '/login'
      return
    }

    setLoading(true)
    try {
      if (isSaved) {
        await api.delete(endpoints.saveOffer(offer.id))
        setIsSaved(false)
      } else {
        await api.post(endpoints.saveOffer(offer.id))
        setIsSaved(true)
      }
    } catch (error) {
      console.error('Error saving offer:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClaim = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isAuthenticated) {
      window.location.href = '/login'
      return
    }

    setLoading(true)
    try {
      await api.post(endpoints.claimOffer(offer.id))
      // Redirect to claimed offers or show success
      window.location.href = '/claimed-offers'
    } catch (error) {
      console.error('Error claiming offer:', error)
      alert(error.response?.data?.detail || 'Failed to claim offer')
    } finally {
      setLoading(false)
    }
  }

  const timeRemaining = getTimeRemaining()
  const availability = getAvailability()
  const isExpired = timeRemaining === 'Expired'
  const isSoldOut = availability === 'Sold out'

  // Get the product image URL - handle different API response structures
  const getImageUrl = () => {
    if (offer.product?.image_url) return offer.product.image_url
    if (offer.products?.image_url) return offer.products.image_url
    if (offer.image_url) return offer.image_url
    return null
  }

  const imageUrl = getImageUrl()

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
        border: urgent ? `2px solid ${brandColors.orange}` : `1px solid ${brandColors.gray[200]}`,
        opacity: isExpired || isSoldOut ? 0.7 : 1,
        position: 'relative',
        maxWidth: '320px'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => window.location.href = `/offers/${offer.id}`}
    >
      {/* Urgent Badge */}
      {urgent && !isExpired && (
        <div style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          backgroundColor: brandColors.orange,
          color: brandColors.white,
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '10px',
          fontWeight: '600',
          zIndex: 10,
          textTransform: 'uppercase'
        }}>
          Expiring Soon
        </div>
      )}

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

      {/* Image or Gradient Background */}
      <div style={{
        height: '140px',
        background: imageUrl 
          ? `url(${imageUrl})` 
          : `linear-gradient(135deg, ${brandColors.deepRed} 0%, ${brandColors.orange} 100%)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        {/* Discount Badge */}
        <div style={{
          backgroundColor: brandColors.white,
          color: brandColors.deepRed,
          padding: '6px 12px',
          borderRadius: '16px',
          fontSize: '18px',
          fontWeight: '700',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}>
          {offer.discount_type === 'percentage' 
            ? `${offer.discount_value}% OFF`
            : `$${offer.discount_value} OFF`
          }
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        {/* Business Name */}
        {(offer.business || offer.businesses) && (
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
              {offer.business?.business_name || offer.businesses?.business_name}
            </span>
            {(offer.business?.is_verified || offer.businesses?.is_verified) && (
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

        {/* Offer Title */}
        <h3 style={{
          ...textStyles.h4,
          fontSize: '16px',
          marginBottom: '6px',
          lineHeight: '1.3',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {offer.title}
        </h3>

        {/* Description */}
        {offer.description && (
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
            {offer.description}
          </p>
        )}

        {/* Price Information */}
        {offer.original_price && offer.discounted_price && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '10px'
          }}>
            <span style={{
              fontSize: '16px',
              fontWeight: '700',
              color: brandColors.deepRed
            }}>
              ${offer.discounted_price}
            </span>
            <span style={{
              fontSize: '13px',
              color: brandColors.gray[500],
              textDecoration: 'line-through'
            }}>
              ${offer.original_price}
            </span>
          </div>
        )}

        {/* Status Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: showClaimButton ? '12px' : '0',
          gap: '8px'
        }}>
          {/* Time Remaining */}
          <span style={{
            fontSize: '11px',
            fontWeight: '600',
            color: urgent || timeRemaining.includes('hour') 
              ? brandColors.orange 
              : brandColors.gray[600],
            backgroundColor: urgent || timeRemaining.includes('hour')
              ? `${brandColors.orange}10`
              : brandColors.gray[100],
            padding: '3px 6px',
            borderRadius: '10px'
          }}>
            {timeRemaining}
          </span>

          {/* Claims Count */}
          {offer.current_claims > 0 && (
            <span style={{
              fontSize: '11px',
              color: brandColors.gray[500]
            }}>
              {offer.current_claims} claimed
            </span>
          )}
        </div>

        {/* Claim Button */}
        {showClaimButton && !isExpired && !isSoldOut && (
          <button
            onClick={handleClaim}
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: loading ? brandColors.gray[400] : brandColors.deepRed,
              color: brandColors.white,
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? 'Claiming...' : isAuthenticated ? 'Claim Offer' : 'Login to Claim'}
          </button>
        )}

        {/* Status Message */}
        {(isExpired || isSoldOut) && (
          <div style={{
            padding: '6px 10px',
            backgroundColor: brandColors.gray[100],
            color: brandColors.gray[600],
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            {isExpired ? 'Offer Expired' : 'Sold Out'}
          </div>
        )}
      </div>
    </div>
  )
}