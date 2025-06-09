// components/claims/QRCodeDisplay.js - Create this new file
'use client'
import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/SimpleToast'
import { apiHelpers, claimUtils } from '@/lib/api'
import { brandColors } from '@/lib/colors'
import { textStyles } from '@/lib/typography'

export default function QRCodeDisplay({ 
  isOpen, 
  onClose, 
  claim,
  onQRCodeLoad 
}) {
  const { toast } = useToast()
  const [qrCodeData, setQrCodeData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load QR code when modal opens
  useEffect(() => {
    if (isOpen && claim?.unique_claim_id) {
      loadQRCode()
    }
  }, [isOpen, claim?.unique_claim_id])

  const loadQRCode = async () => {
    if (!claim?.unique_claim_id) {
      setError('Invalid claim ID')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const result = await apiHelpers.getClaimQRCode(claim.unique_claim_id)
      
      if (result.success) {
        setQrCodeData(result.data)
        onQRCodeLoad?.(result.data)
      } else {
        setError(result.error)
        toast.error('Failed to load QR code')
      }
    } catch (error) {
      console.error('Error loading QR code:', error)
      setError('Something went wrong while loading the QR code')
      toast.error('Failed to load QR code')
    } finally {
      setLoading(false)
    }
  }

  // Copy claim ID to clipboard
  const copyClaimId = async () => {
    try {
      await navigator.clipboard.writeText(claim.unique_claim_id)
      toast.success('📋 Claim ID copied to clipboard!')
    } catch (error) {
      console.error('Copy failed:', error)
      toast.error('Failed to copy claim ID')
    }
  }

  // Download QR code as image
  const downloadQRCode = () => {
    if (!qrCodeData?.qr_code) {
      toast.error('QR code not available for download')
      return
    }

    try {
      // Create download link
      const link = document.createElement('a')
      link.href = qrCodeData.qr_code
      link.download = `claim-${claim.unique_claim_id}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('📱 QR code downloaded!')
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('Failed to download QR code')
    }
  }

  // Share QR code (if Web Share API is available)
  const shareQRCode = async () => {
    if (!qrCodeData?.qr_code) {
      toast.error('QR code not available for sharing')
      return
    }

    const shareData = {
      title: `Claim: ${claim.offer?.title}`,
      text: `My claimed offer from ${claim.offer?.businesses?.business_name || 'merchant'}`,
      url: window.location.href
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error)
          toast.error('Failed to share')
        }
      }
    } else {
      // Fallback: copy to clipboard
      const shareText = `${shareData.title}\n${shareData.text}\nClaim ID: ${claim.unique_claim_id}`
      try {
        await navigator.clipboard.writeText(shareText)
        toast.success('📋 Claim details copied for sharing!')
      } catch (error) {
        toast.error('Sharing not supported on this device')
      }
    }
  }

  // Retry loading QR code
  const retryLoad = () => {
    loadQRCode()
  }

  if (!isOpen) return null

  const offer = claim?.offer
  const business = offer?.businesses || offer?.business

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: brandColors.white,
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px'
        }}>
          <div>
            <h2 style={{
              ...textStyles.h3,
              margin: 0,
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📱 QR Code
            </h2>
            <p style={{
              ...textStyles.body,
              fontSize: '14px',
              color: brandColors.gray[600],
              margin: 0
            }}>
              Show this to the merchant for redemption
            </p>
          </div>
          
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: brandColors.gray[500],
              padding: '4px',
              borderRadius: '4px',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.color = brandColors.gray[700]}
            onMouseLeave={(e) => e.target.style.color = brandColors.gray[500]}
          >
            ×
          </button>
        </div>

        {/* Offer Summary */}
        <div style={{
          backgroundColor: brandColors.gray[50],
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '24px'
        }}>
          <h3 style={{
            ...textStyles.h4,
            fontSize: '16px',
            marginBottom: '8px'
          }}>
            {offer?.title || 'Offer Title'}
          </h3>
          
          <p style={{
            fontSize: '14px',
            color: brandColors.gray[600],
            marginBottom: '12px'
          }}>
            {business?.business_name || 'Business Name'}
          </p>

          {offer?.original_price && offer?.discounted_price && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ 
                  fontSize: '14px', 
                  color: brandColors.gray[600] 
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
                  fontSize: '20px', 
                  fontWeight: 'bold', 
                  color: brandColors.deepRed 
                }}>
                  ${offer.discounted_price}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* QR Code Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          {loading && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              padding: '48px 24px'
            }}>
              <div className="loading-spinner"></div>
              <p style={{ color: brandColors.gray[600] }}>
                Generating QR code...
              </p>
            </div>
          )}

          {error && (
            <div style={{
              padding: '48px 24px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <h4 style={{
                ...textStyles.h4,
                marginBottom: '8px',
                color: brandColors.error
              }}>
                QR Code Error
              </h4>
              <p style={{
                fontSize: '14px',
                color: brandColors.gray[600],
                marginBottom: '16px'
              }}>
                {error}
              </p>
              <button
                onClick={retryLoad}
                style={{
                  padding: '8px 16px',
                  backgroundColor: brandColors.deepRed,
                  color: brandColors.white,
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
            </div>
          )}

          {qrCodeData?.qr_code && !loading && !error && (
            <div>
              {/* QR Code Image */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <div style={{
                  padding: '20px',
                  backgroundColor: brandColors.white,
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  border: `2px solid ${brandColors.gray[200]}`
                }}>
                  <img
                    src={qrCodeData.qr_code}
                    alt="QR Code"
                    style={{
                      width: '200px',
                      height: '200px',
                      display: 'block'
                    }}
                  />
                </div>
              </div>

              {/* Instructions */}
              <div style={{
                backgroundColor: brandColors.deepRed + '10',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: brandColors.deepRed
                }}>
                  📱 How to Use:
                </h4>
                <ol style={{
                  fontSize: '13px',
                  color: brandColors.gray[700],
                  margin: 0,
                  paddingLeft: '16px',
                  lineHeight: '1.5'
                }}>
                  <li>Show this QR code to the merchant</li>
                  <li>Let them scan it with their device</li>
                  <li>If scanning fails, provide the claim ID below</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Claim ID Section */}
        <div style={{
          backgroundColor: brandColors.gray[50],
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{
              fontSize: '14px',
              fontWeight: '600',
              color: brandColors.gray[700]
            }}>
              Claim ID (if QR fails):
            </span>
            <button
              onClick={copyClaimId}
              style={{
                padding: '4px 8px',
                backgroundColor: brandColors.white,
                color: brandColors.deepRed,
                border: `1px solid ${brandColors.deepRed}`,
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              📋 Copy
            </button>
          </div>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '16px',
            fontWeight: 'bold',
            textAlign: 'center',
            padding: '8px',
            backgroundColor: brandColors.white,
            borderRadius: '4px',
            border: `1px solid ${brandColors.gray[300]}`,
            letterSpacing: '1px'
          }}>
            {claim.unique_claim_id}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {qrCodeData?.qr_code && (
            <>
              <button
                onClick={downloadQRCode}
                style={{
                  padding: '12px 20px',
                  backgroundColor: brandColors.white,
                  color: brandColors.deepRed,
                  border: `2px solid ${brandColors.deepRed}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = brandColors.deepRed
                  e.target.style.color = brandColors.white
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = brandColors.white
                  e.target.style.color = brandColors.deepRed
                }}
              >
                💾 Download
              </button>

              <button
                onClick={shareQRCode}
                style={{
                  padding: '12px 20px',
                  backgroundColor: brandColors.white,
                  color: brandColors.gray[700],
                  border: `2px solid ${brandColors.gray[300]}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = brandColors.gray[100]
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = brandColors.white
                }}
              >
                📤 Share
              </button>
            </>
          )}

          <button
            onClick={onClose}
            style={{
              padding: '12px 20px',
              backgroundColor: brandColors.gray[200],
              color: brandColors.gray[700],
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = brandColors.gray[300]
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = brandColors.gray[200]
            }}
          >
            Close
          </button>
        </div>

        {/* Additional Info */}
        {business?.business_address && (
          <div style={{
            marginTop: '24px',
            padding: '16px',
            backgroundColor: brandColors.gray[50],
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px',
              color: brandColors.gray[700]
            }}>
              📍 Business Location:
            </h4>
            <p style={{
              fontSize: '13px',
              color: brandColors.gray[600],
              margin: 0
            }}>
              {claimUtils.formatMerchantAddress(business.business_address)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}