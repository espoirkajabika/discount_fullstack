// lib/offers.js
import { makeAuthenticatedRequest } from '@/lib/auth';

class OffersService {
  // Get all offers for current business
  async getOffers(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add pagination
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      // Add sorting
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      
      // Add filters
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.productId) queryParams.append('productId', params.productId);
      
      const url = `/business/offers${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await makeAuthenticatedRequest(url);
      
      if (!response || !response.ok) {
        const data = await response?.json();
        return { error: data?.detail || 'Failed to fetch offers' };
      }
      
      const data = await response.json();
      return { 
        success: true, 
        offers: data.offers || [],
        pagination: data.pagination || {}
      };
    } catch (error) {
      console.error('Get offers error:', error);
      return { error: 'Network error. Please try again.' };
    }
  }

  // Get single offer by ID
  async getOffer(offerId) {
    try {
      const response = await makeAuthenticatedRequest(`/business/offers/${offerId}`);
      
      if (!response || !response.ok) {
        const data = await response?.json();
        return { error: data?.detail || 'Offer not found' };
      }
      
      const data = await response.json();
      return { success: true, offer: data.offer || data };
    } catch (error) {
      console.error('Get offer error:', error);
      return { error: 'Network error. Please try again.' };
    }
  }

  // Create new offer
  async createOffer(offerData) {
    try {
      const response = await makeAuthenticatedRequest('/business/offers', {
        method: 'POST',
        body: JSON.stringify(offerData),
      });
      
      if (!response || !response.ok) {
        const data = await response?.json();
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            const errorMessages = data.detail.map(err => {
              const field = err.loc ? err.loc[err.loc.length - 1] : 'field';
              return `${field}: ${err.msg}`;
            }).join(', ');
            return { error: `Validation errors - ${errorMessages}` };
          } else {
            return { error: data.detail };
          }
        }
        return { error: data?.message || 'Failed to create offer' };
      }
      
      const data = await response.json();
      return { success: true, offer: data.offer || data };
    } catch (error) {
      console.error('Create offer error:', error);
      return { error: 'Network error. Please try again.' };
    }
  }

  // Update existing offer
  async updateOffer(offerId, offerData) {
    try {
      const response = await makeAuthenticatedRequest(`/business/offers/${offerId}`, {
        method: 'PUT',
        body: JSON.stringify(offerData),
      });
      
      if (!response || !response.ok) {
        const data = await response?.json();
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            const errorMessages = data.detail.map(err => {
              const field = err.loc ? err.loc[err.loc.length - 1] : 'field';
              return `${field}: ${err.msg}`;
            }).join(', ');
            return { error: `Validation errors - ${errorMessages}` };
          } else {
            return { error: data.detail };
          }
        }
        return { error: data?.message || 'Failed to update offer' };
      }
      
      const data = await response.json();
      return { success: true, offer: data.offer || data };
    } catch (error) {
      console.error('Update offer error:', error);
      return { error: 'Network error. Please try again.' };
    }
  }

  // Update offer status (activate/deactivate)
  async updateOfferStatus(offerId, isActive) {
    try {
      const response = await makeAuthenticatedRequest(`/business/offers/${offerId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: isActive }),
      });
      
      if (!response || !response.ok) {
        const data = await response?.json();
        return { error: data?.detail || 'Failed to update offer status' };
      }
      
      const data = await response.json();
      return { success: true, offer: data.offer || data };
    } catch (error) {
      console.error('Update offer status error:', error);
      return { error: 'Network error. Please try again.' };
    }
  }

  // Delete offer
  async deleteOffer(offerId) {
    try {
      const response = await makeAuthenticatedRequest(`/business/offers/${offerId}`, {
        method: 'DELETE',
      });
      
      if (!response || !response.ok) {
        const data = await response?.json();
        return { error: data?.detail || 'Failed to delete offer' };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Delete offer error:', error);
      return { error: 'Network error. Please try again.' };
    }
  }

  // Get offer analytics
  async getOfferAnalytics(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.offerId) queryParams.append('offerId', params.offerId);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      
      const url = `/business/offers/analytics${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await makeAuthenticatedRequest(url);
      
      if (!response || !response.ok) {
        const data = await response?.json();
        return { error: data?.detail || 'Failed to fetch analytics' };
      }
      
      const data = await response.json();
      return { 
        success: true, 
        analytics: data.analytics || data
      };
    } catch (error) {
      console.error('Get offer analytics error:', error);
      return { error: 'Network error. Please try again.' };
    }
  }

  // Get trending offers (public)
  async getTrendingOffers(limit = 10) {
    try {
      const response = await makeAuthenticatedRequest(`/customer/offers/trending?limit=${limit}`);
      
      if (!response || !response.ok) {
        const data = await response?.json();
        return { error: data?.detail || 'Failed to fetch trending offers' };
      }
      
      const data = await response.json();
      return { success: true, offers: data.offers || [] };
    } catch (error) {
      console.error('Get trending offers error:', error);
      return { error: 'Network error. Please try again.' };
    }
  }

  // Get expiring offers
  async getExpiringOffers(hours = 24, limit = 10) {
    try {
      const response = await makeAuthenticatedRequest(`/customer/offers/expiring-soon?hours=${hours}&limit=${limit}`);
      
      if (!response || !response.ok) {
        const data = await response?.json();
        return { error: data?.detail || 'Failed to fetch expiring offers' };
      }
      
      const data = await response.json();
      return { success: true, offers: data.offers || [] };
    } catch (error) {
      console.error('Get expiring offers error:', error);
      return { error: 'Network error. Please try again.' };
    }
  }

  // Get offer claims
  async getOfferClaims(offerId, params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.redeemed !== undefined) queryParams.append('redeemed', params.redeemed);
      
      const url = `/business/offers/${offerId}/claims${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await makeAuthenticatedRequest(url);
      
      if (!response || !response.ok) {
        const data = await response?.json();
        return { error: data?.detail || 'Failed to fetch offer claims' };
      }
      
      const data = await response.json();
      return { 
        success: true, 
        claims: data.claims || [],
        pagination: data.pagination || {}
      };
    } catch (error) {
      console.error('Get offer claims error:', error);
      return { error: 'Network error. Please try again.' };
    }
  }

  // Mark claim as redeemed
  async markClaimRedeemed(claimId, notes = '') {
    try {
      const response = await makeAuthenticatedRequest(`/business/offers/claims/${claimId}/redeem`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          redemption_notes: notes,
          is_redeemed: true 
        }),
      });
      
      if (!response || !response.ok) {
        const data = await response?.json();
        return { error: data?.detail || 'Failed to mark claim as redeemed' };
      }
      
      const data = await response.json();
      return { success: true, claim: data.claim || data };
    } catch (error) {
      console.error('Mark claim redeemed error:', error);
      return { error: 'Network error. Please try again.' };
    }
  }
}

// Create singleton instance
const offersService = new OffersService();

// Export convenience functions
export const getOffers = (params) => offersService.getOffers(params);
export const getOffer = (id) => offersService.getOffer(id);
export const createOffer = (data) => offersService.createOffer(data);
export const updateOffer = (id, data) => offersService.updateOffer(id, data);
export const updateOfferStatus = (id, isActive) => offersService.updateOfferStatus(id, isActive);
export const deleteOffer = (id) => offersService.deleteOffer(id);
export const getOfferAnalytics = (params) => offersService.getOfferAnalytics(params);
export const getTrendingOffers = (limit) => offersService.getTrendingOffers(limit);
export const getExpiringOffers = (hours, limit) => offersService.getExpiringOffers(hours, limit);
export const getOfferClaims = (id, params) => offersService.getOfferClaims(id, params);
export const markClaimRedeemed = (claimId, notes) => offersService.markClaimRedeemed(claimId, notes);

export default offersService;