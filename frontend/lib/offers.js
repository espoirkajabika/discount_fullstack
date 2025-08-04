// lib/offers.js
import { makeAuthenticatedRequest } from './auth'

/**
 * Get all offers for current business with pagination and filters
 */
export async function getOffers(params = {}) {
  try {
    const queryParams = new URLSearchParams()
    
    // Add pagination
    if (params.page) queryParams.append('page', params.page)
    if (params.limit) queryParams.append('limit', params.limit)
    
    // Add search
    if (params.search) queryParams.append('search', params.search)
    
    // Add status filter
    if (params.status) queryParams.append('status', params.status)
    
    // Add product filter
    if (params.product_id) queryParams.append('product_id', params.product_id)
    
    // Add sorting
    if (params.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)
    
    const url = `/business/offers${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    const response = await makeAuthenticatedRequest(url)
    
    if (!response || !response.ok) {
      const data = await response?.json()
      return { error: data?.detail || 'Failed to fetch offers' }
    }
    
    const data = await response.json()
    return { 
      success: true, 
      offers: data.offers || [],
      pagination: data.pagination || {}
    }
  } catch (error) {
    console.error('Get offers error:', error)
    return { error: 'Network error. Please try again.' }
  }
}

/**
 * Get single offer by ID
 */
export async function getOffer(offerId) {
  try {
    const response = await makeAuthenticatedRequest(`/business/offers/${offerId}`)
    
    if (!response || !response.ok) {
      const data = await response?.json()
      return { error: data?.detail || 'Offer not found' }
    }
    
    const data = await response.json()
    return { success: true, offer: data.offer || data }
  } catch (error) {
    console.error('Get offer error:', error)
    return { error: 'Network error. Please try again.' }
  }
}

/**
 * Create new offer
 */
export async function createOffer(offerData) {
  try {
    console.log('Creating offer with data:', offerData)
    
    const response = await makeAuthenticatedRequest('/business/offers', {
      method: 'POST',
      body: JSON.stringify(offerData),
    })
    
    if (!response || !response.ok) {
      const data = await response?.json()
      console.error('Offer creation failed:', data)
      
      if (data && data.detail) {
        if (Array.isArray(data.detail)) {
          const errorMessages = data.detail.map(err => {
            const field = err.loc ? err.loc[err.loc.length - 1] : 'field'
            return `${field}: ${err.msg}`
          }).join(', ')
          return { error: `Validation errors - ${errorMessages}` }
        } else {
          return { error: data.detail }
        }
      }
      return { error: 'Failed to create offer' }
    }
    
    const data = await response.json()
    console.log('Offer created successfully:', data)
    
    return { success: true, offer: data.offer || data }
  } catch (error) {
    console.error('Create offer error:', error)
    return { error: 'Network error. Please try again.' }
  }
}

/**
 * Update existing offer
 */
export async function updateOffer(offerId, offerData) {
  try {
    console.log('Updating offer:', offerId, 'with data:', offerData)
    
    const response = await makeAuthenticatedRequest(`/business/offers/${offerId}`, {
      method: 'PUT',
      body: JSON.stringify(offerData),
    })
    
    if (!response || !response.ok) {
      const data = await response?.json()
      console.error('Offer update failed:', data)
      
      if (data && data.detail) {
        if (Array.isArray(data.detail)) {
          const errorMessages = data.detail.map(err => {
            const field = err.loc ? err.loc[err.loc.length - 1] : 'field'
            return `${field}: ${err.msg}`
          }).join(', ')
          return { error: `Validation errors - ${errorMessages}` }
        } else {
          return { error: data.detail }
        }
      }
      return { error: 'Failed to update offer' }
    }
    
    const data = await response.json()
    console.log('Offer updated successfully:', data)
    
    return { success: true, offer: data.offer || data }
  } catch (error) {
    console.error('Update offer error:', error)
    return { error: 'Network error. Please try again.' }
  }
}

/**
 * Delete offer
 */
export async function deleteOffer(offerId) {
  try {
    const response = await makeAuthenticatedRequest(`/business/offers/${offerId}`, {
      method: 'DELETE',
    })
    
    if (!response || !response.ok) {
      const data = await response?.json()
      return { error: data?.detail || 'Failed to delete offer' }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Delete offer error:', error)
    return { error: 'Network error. Please try again.' }
  }
}

/**
 * Toggle offer status (activate/deactivate)
 */
export async function toggleOfferStatus(offerId, isActive) {
  try {
    const response = await makeAuthenticatedRequest(`/business/offers/${offerId}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    })
    
    if (!response || !response.ok) {
      const data = await response?.json()
      return { error: data?.detail || 'Failed to update offer status' }
    }
    
    const data = await response.json()
    return { success: true, offer: data.offer || data }
  } catch (error) {
    console.error('Toggle offer status error:', error)
    return { error: 'Network error. Please try again.' }
  }
}

/**
 * Get offer analytics/stats
 */
export async function getOfferAnalytics(offerId, params = {}) {
  try {
    const queryParams = new URLSearchParams()
    
    if (params.period) queryParams.append('period', params.period)
    if (params.start_date) queryParams.append('start_date', params.start_date)
    if (params.end_date) queryParams.append('end_date', params.end_date)
    
    const url = `/business/offers/${offerId}/analytics${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    const response = await makeAuthenticatedRequest(url)
    
    if (!response || !response.ok) {
      const data = await response?.json()
      return { error: data?.detail || 'Failed to fetch offer analytics' }
    }
    
    const data = await response.json()
    return { success: true, analytics: data }
  } catch (error) {
    console.error('Get offer analytics error:', error)
    return { error: 'Network error. Please try again.' }
  }
}

/**
 * Get claimed offers for business (for redemption)
 */
export async function getClaimedOffers(params = {}) {
  try {
    const queryParams = new URLSearchParams()
    
    if (params.page) queryParams.append('page', params.page)
    if (params.limit) queryParams.append('limit', params.limit)
    if (params.redeemed_only !== undefined) queryParams.append('redeemed_only', params.redeemed_only)
    if (params.offer_id) queryParams.append('offer_id', params.offer_id)
    
    const url = `/business/claimed-offers${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    const response = await makeAuthenticatedRequest(url)
    
    if (!response || !response.ok) {
      const data = await response?.json()
      return { error: data?.detail || 'Failed to fetch claimed offers' }
    }
    
    const data = await response.json()
    return { success: true, data: data }
  } catch (error) {
    console.error('Get claimed offers error:', error)
    return { error: 'Network error. Please try again.' }
  }
}