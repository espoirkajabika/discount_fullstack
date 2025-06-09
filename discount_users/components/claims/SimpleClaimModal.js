// components/claims/SimpleClaimModal.js - Create this new file
'use client'
import { useState } from 'react'
import { useToast } from '@/components/ui/SimpleToast'
import { apiHelpers, claimUtils } from '@/lib/api'
import { brandColors } from '@/lib/colors'
import { textStyles } from '@/lib/typography'

export default function SimpleClaimModal({ 
  isOpen, 
  onClose, 
  offer, 
  onClaimSuccess 
}) {
  const { toast } = useToast()
  const [claimType, setClaimType] = useState('in_store')
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Calculate available claims
  const availableClaims = offer.max_claims 
    ? offer.max_claims - offer.current_claims 
    : 999

  // Validate form
  const validateForm = () => {
    if (quantity < 1) {
      setError('Quantity must be at least 1')
      return false
    }
    
    if (offer.max_claims && (offer.current_claims + quantity) > offer.max_claims) {
      const available = offer.max_claims - offer.current_claims
      setError(`Only ${available} claims remaining`)
      return false
    }
    
    setError('')
    return true
  }

  // Handle claim submission
  const handleClaim = async () => {
    if (!validateForm()) return

    setIsLoading(true)

    try {
      const claimData = {
        claim_type: claimType,
        quantity: quantity
      }

      const result = await apiHelpers.claimOffer(offer.id, claimData)

      if (result.success) {
        toast.success("🎉 Offer claimed successfully!")
        
        // Show type-specific message
        if (claimType === 'in_store') {
          setTimeout(() => {
            toast.info("🏪 QR code ready for in-store redemption!")
          }, 1000)
        } else {
          setTimeout(() => {
            toast.info("🌐 Redirecting to merchant website...")
          }, 1000)
        }

        onClaimSuccess?.(result.data)
        onClose()

        // Handle redirect for online claims
        if (claimType === 'online' && result.data.redirect_url) {
          setTimeout(() => {
            window.open(result.data.redirect_url, '_blank')
          }, 2000)
        }

        // Navigate to claimed offers
        setTimeout(() => {
          window.location.href = "/claimed-offers"
        }, 2500)
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      console.error('Claim error:', error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle quantity change
  const handleQuantityChange = (value) => {
    const numValue = parseInt(value) || 1
    const maxAllowed = Math.min(availableClaims, 10) // Limit to 10 max
    setQuantity(Math.max(1, Math.min(numValue, maxAllowed)))
    setError('') // Clear error when user changes value
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: brandColors.white,
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{
            ...textStyles.h3,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🎫 Claim Offer
            <span style={{
              backgroundColor: brandColors.orange,
              color: brandColors.white,
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              ${offer.discount_value} OFF
            </span>
          </h2>
          
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: brandColors.gray[500],
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        {/* Offer Summary */}
        <div style={{
          backgroundColor: brandColors.gray[50],
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <h3 style={{
            ...textStyles.h4,
            marginBottom: '8px',
            fontSize: '16px'
          }}>
            {offer.title}
          </h3>
          
          {offer.original_price && offer.discounted_price && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '14px', color: brandColors.gray[600] }}>
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
                <span style={{ fontSize: '14px', color: brandColors.gray[600] }}>
                  Your Price: 
                </span>
                <span style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  color: brandColors.deepRed,
                  marginLeft: '4px'
                }}>
                  ${offer.discounted_price}
                </span>
              </div>
            </div>
          )}
          
          {offer.max_claims && (
            <div style={{
              marginTop: '8px',
              fontSize: '12px',
              color: brandColors.gray[600]
            }}>
              {availableClaims} of {offer.max_claims} claims remaining
            </div>
          )}
        </div>

        {/* Quantity Selection */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: brandColors.gray[700]
          }}>
            Quantity
          </label>
          <input
            type="number"
            min="1"
            max={Math.min(availableClaims, 10)}
            value={quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: `1px solid ${error ? brandColors.error : brandColors.gray[300]}`,
              borderRadius: '8px',
              fontSize: '16px',
              outline: 'none'
            }}
          />
          {error && (
            <p style={{
              color: brandColors.error,
              fontSize: '12px',
              marginTop: '4px'
            }}>
              {error}
            </p>
          )}
          <p style={{
            fontSize: '12px',
            color: brandColors.gray[500],
            marginTop: '4px'
          }}>
            Maximum {Math.min(availableClaims, 10)} per transaction
          </p>
        </div>

        {/* Claim Type Selection */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            marginBottom: '12px',
            fontSize: '14px',
            fontWeight: '600',
            color: brandColors.gray[700]
          }}>
            How would you like to claim this offer?
          </label>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* In-Store Option */}
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '16px',
              border: `2px solid ${claimType === 'in_store' ? brandColors.deepRed : brandColors.gray[200]}`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor: claimType === 'in_store' ? `${brandColors.deepRed}05` : brandColors.white
            }}>
              <input
                type="radio"
                name="claimType"
                value="in_store"
                checked={claimType === 'in_store'}
                onChange={(e) => setClaimType(e.target.value)}
                style={{ marginTop: '2px' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px'
                }}>
                  <span style={{ fontSize: '18px' }}>🏪</span>
                  <span style={{ fontWeight: '600', fontSize: '16px' }}>
                    In-Store Pickup
                  </span>
                </div>
                <p style={{
                  fontSize: '14px',
                  color: brandColors.gray[600],
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  Get a QR code to show at the merchant location. Perfect for immediate pickup or when you want to see the product first.
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '8px',
                  fontSize: '12px',
                  color: brandColors.gray[500]
                }}>
                  <span>📱</span>
                  <span>QR code provided</span>
                </div>
              </div>
            </label>

            {/* Online Option */}
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '16px',
              border: `2px solid ${claimType === 'online' ? brandColors.deepRed : brandColors.gray[200]}`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor: claimType === 'online' ? `${brandColors.deepRed}05` : brandColors.white
            }}>
              <input
                type="radio"
                name="claimType"
                value="online"
                checked={claimType === 'online'}
                onChange={(e) => setClaimType(e.target.value)}
                style={{ marginTop: '2px' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px'
                }}>
                  <span style={{ fontSize: '18px' }}>🌐</span>
                  <span style={{ fontWeight: '600', fontSize: '16px' }}>
                    Online Purchase
                  </span>
                </div>
                <p style={{
                  fontSize: '14px',
                  color: brandColors.gray[600],
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  Claim now and complete your purchase on the merchant's website. Great for delivery or online-only offers.
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '8px',
                  fontSize: '12px',
                  color: brandColors.gray[500]
                }}>
                  <span>🔗</span>
                  <span>Redirects to merchant site</span>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Terms and Conditions */}
        {offer.terms_conditions && (
          <div style={{
            backgroundColor: brandColors.gray[50],
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '24px'
          }}>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '6px',
              color: brandColors.gray[700]
            }}>
              Terms & Conditions
            </h4>
            <p style={{
              fontSize: '12px',
              color: brandColors.gray[600],
              margin: 0,
              lineHeight: '1.4'
            }}>
              {offer.terms_conditions}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: '12px 24px',
              backgroundColor: brandColors.gray[200],
              color: brandColors.gray[700],
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            Cancel
          </button>
          
          <button
            onClick={handleClaim}
            disabled={isLoading || !!error}
            style={{
              padding: '12px 24px',
              backgroundColor: isLoading || error ? brandColors.gray[400] : brandColors.deepRed,
              color: brandColors.white,
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isLoading || error ? 'not-allowed' : 'pointer',
              minWidth: '120px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isLoading ? (
              <>
                <div style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid transparent',
                  borderTop: '2px solid currentColor',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Claiming...
              </>
            ) : (
              `Claim ${quantity} ${quantity === 1 ? 'Offer' : 'Offers'}`
            )}
          </button>
        </div>
      </div>
    </div>
  )
}