// hooks/useRedemption.js
import { useState, useCallback } from 'react'
import { makeAuthenticatedRequest } from '@/lib/auth'

export function useRedemption() {
  const [isVerifying, setIsVerifying] = useState(false)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [claimDetails, setClaimDetails] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Verify claim by claim ID or QR code
  const verifyClaim = useCallback(async (identifier, type = 'claim_id') => {
    setIsVerifying(true)
    setError('')
    setSuccess('')
    
    try {
      let endpoint = '/business/claims/verify'
      const body = type === 'claim_id' 
        ? { claim_id: identifier }
        : { qr_code: identifier }

      const response = await makeAuthenticatedRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      })

      if (!response || !response.ok) {
        const data = await response?.json()
        throw new Error(data?.detail || 'Failed to verify claim')
      }

      const data = await response.json()
      
      if (data.claim) {
        setClaimDetails(data.claim)
        setSuccess('Claim verified successfully!')
      } else {
        throw new Error('Invalid claim or claim not found')
      }
    } catch (err) {
      console.error('Verify claim error:', err)
      setError(err.message || 'Failed to verify claim')
      setClaimDetails(null)
    } finally {
      setIsVerifying(false)
    }
  }, [])

  // Redeem a verified claim
  const redeemClaim = useCallback(async (claimId, notes = '') => {
    setIsRedeeming(true)
    setError('')
    setSuccess('')
    
    try {
      const response = await makeAuthenticatedRequest('/business/claims/redeem', {
        method: 'POST',
        body: JSON.stringify({
          claim_id: claimId,
          redemption_notes: notes
        })
      })

      if (!response || !response.ok) {
        const data = await response?.json()
        throw new Error(data?.detail || 'Failed to redeem claim')
      }

      const data = await response.json()
      setSuccess('Claim redeemed successfully!')
      
      // Update claim details to show as redeemed
      if (claimDetails && claimDetails.claim_id === claimId) {
        setClaimDetails({
          ...claimDetails,
          is_redeemed: true,
          redeemed_at: new Date().toISOString(),
          redemption_notes: notes
        })
      }
      
      return { success: true, data }
    } catch (err) {
      console.error('Redeem claim error:', err)
      setError(err.message || 'Failed to redeem claim')
      return { success: false, error: err.message }
    } finally {
      setIsRedeeming(false)
    }
  }, [claimDetails])

  // Get redemption history
  const getRedemptionHistory = useCallback(async (params = {}) => {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.page) queryParams.append('page', params.page)
      if (params.limit) queryParams.append('limit', params.limit)
      if (params.redeemed_only !== undefined) queryParams.append('redeemed_only', params.redeemed_only)
      if (params.offer_id) queryParams.append('offer_id', params.offer_id)
      if (params.start_date) queryParams.append('start_date', params.start_date)
      if (params.end_date) queryParams.append('end_date', params.end_date)
      
      const url = `/business/claimed-offers${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      const response = await makeAuthenticatedRequest(url)
      
      if (!response || !response.ok) {
        const data = await response?.json()
        return { success: false, error: data?.detail || 'Failed to fetch redemption history' }
      }
      
      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error('Get redemption history error:', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }, [])

  // Get redemption statistics
  const getRedemptionStats = useCallback(async (period = 30) => {
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('period', period)
      
      const url = `/business/redemption-stats?${queryParams.toString()}`
      const response = await makeAuthenticatedRequest(url)
      
      if (!response || !response.ok) {
        const data = await response?.json()
        return { success: false, error: data?.detail || 'Failed to fetch redemption stats' }
      }
      
      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error('Get redemption stats error:', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }, [])

  // Reset all states
  const reset = useCallback(() => {
    setClaimDetails(null)
    setError('')
    setSuccess('')
    setIsVerifying(false)
    setIsRedeeming(false)
  }, [])

  // Clear messages
  const clearMessages = useCallback(() => {
    setError('')
    setSuccess('')
  }, [])

  return {
    // States
    isVerifying,
    isRedeeming,
    claimDetails,
    error,
    success,
    
    // Actions
    verifyClaim,
    redeemClaim,
    getRedemptionHistory,
    getRedemptionStats,
    reset,
    clearMessages,
    
    // Computed states
    hasClaimDetails: !!claimDetails,
    canRetry: !!error && !isVerifying && !isRedeeming
  }
}