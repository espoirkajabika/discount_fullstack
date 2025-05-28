// components/offers/OfferCard.js
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
        border: urgent ? `2px solid ${brandColors.orange}` : `1px solid ${brandColors.gray[200]}`,
        opacity: isExpired || isSoldOut ? 0.7 : 1,
        position: 'relative'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => window.location.href = `/offers/${offer.id}`}
    >
      {/* Urgent Badge */}
      {urgent && !isExpired && (
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          backgroundColor: brandColors.orange,
          color: brandColors.white,
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '11px',
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

      {/* Image or Gradient Background */}
      <div style={{
        height: compact ? '120px' : '160px',
        background: offer.product?.image_url 
          ? `url(${offer.product.image_url})` 
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
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '24px',
          fontWeight: '700',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}>
          {offer.discount_type === 'percentage' 
            ? `${offer.discount_value}% OFF`
            : `$${offer.discount_value} OFF`
          }
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: compact ? '16px' : '20px' }}>
        {/* Business Name */}
        {offer.business && (
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
              {offer.business.business_name}
            </span>
            {offer.business.is_verified && (
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

        {/* Offer Title */}
        <h3 style={{
          ...textStyles.h4,
          fontSize: compact ? '16px' : '18px',
          marginBottom: '8px',
          lineHeight: '1.3'
        }}>
          {offer.title}
        </h3>

        {/* Description */}
        {offer.description && !compact && (
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
            {offer.description}
          </p>
        )}

        {/* Price Information */}
        {offer.original_price && offer.discounted_price && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <span style={{
              fontSize: '18px',
              fontWeight: '700',
              color: brandColors.deepRed
            }}>
              ${offer.discounted_price}
            </span>
            <span style={{
              fontSize: '14px',
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
          marginBottom: showClaimButton ? '16px' : '0'
        }}>
          {/* Time Remaining */}
          <span style={{
            fontSize: '12px',
            fontWeight: '600',
            color: urgent || timeRemaining.includes('hour') 
              ? brandColors.orange 
              : brandColors.gray[600],
            backgroundColor: urgent || timeRemaining.includes('hour')
              ? `${brandColors.orange}10`
              : brandColors.gray[100],
            padding: '4px 8px',
            borderRadius: '12px'
          }}>
            {timeRemaining}
          </span>

          {/* Availability */}
          {availability && (
            <span style={{
              fontSize: '12px',
              fontWeight: '600',
              color: availability.includes('Only') ? brandColors.orange : brandColors.gray[600]
            }}>
              {availability}
            </span>
          )}

          {/* Claims Count */}
          {offer.current_claims > 0 && (
            <span style={{
              fontSize: '12px',
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
              padding: '12px',
              backgroundColor: loading ? brandColors.gray[400] : brandColors.deepRed,
              color: brandColors.white,
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
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
            padding: '8px 12px',
            backgroundColor: brandColors.gray[100],
            color: brandColors.gray[600],
            borderRadius: '6px',
            fontSize: '14px',
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