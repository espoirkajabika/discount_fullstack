// utils/redemptionApi.js - Fixed exports and error handling

import { getToken } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';

// Base API call function that uses your auth system
const apiCall = async (endpoint, options = {}) => {
  const token = getToken(); // Use your auth utility
  
  console.log('Making API call to:', `${API_BASE_URL}${endpoint}`);
  console.log('Token exists:', !!token);
  console.log('Token length:', token ? token.length : 0);
  
  if (!token) {
    throw new Error('AUTHENTICATION_REQUIRED');
  }

  const config = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      if (response.status === 401) {
        console.error('401 Unauthorized - token may be invalid');
        throw new Error('AUTHENTICATION_FAILED');
      }
      if (response.status === 403) {
        throw new Error('INSUFFICIENT_PERMISSIONS');
      }
      if (response.status === 404) {
        throw new Error('RESOURCE_NOT_FOUND');
      }
      
      const errorData = await response.json().catch(() => ({ 
        detail: `HTTP ${response.status}: ${response.statusText}` 
      }));
      throw new Error(errorData.detail || errorData.message || 'API request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// Redemption API functions
export const redemptionApi = {
  /**
   * Verify a claim by claim ID or QR code content
   * @param {string} claimIdentifier - The claim ID or QR code content
   * @param {string} verificationType - 'claim_id' or 'qr_code'
   * @returns {Promise<Object>} Verification result
   */
  verifyClaim: async (claimIdentifier, verificationType = 'claim_id') => {
    return apiCall('/business/redeem/verify', {
      method: 'POST',
      body: JSON.stringify({
        claim_identifier: claimIdentifier,
        verification_type: verificationType
      })
    });
  },

  /**
   * Complete the redemption of a verified claim
   * @param {string} claimId - The claim ID to redeem
   * @param {string} redemptionNotes - Optional notes for the redemption
   * @returns {Promise<Object>} Redemption result
   */
  redeemClaim: async (claimId, redemptionNotes = '') => {
    return apiCall('/business/redeem/complete', {
      method: 'POST',
      body: JSON.stringify({
        claim_id: claimId,
        redemption_notes: redemptionNotes
      })
    });
  },

  /**
   * Get redemption history for the business
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Redemption history
   */
  getRedemptionHistory: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add parameters
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    if (params.offer_id) queryParams.append('offer_id', params.offer_id);
    if (params.redeemed_only !== undefined) queryParams.append('redeemed_only', params.redeemed_only);

    const queryString = queryParams.toString();
    const endpoint = `/business/redeem/history${queryString ? `?${queryString}` : ''}`;
    
    return apiCall(endpoint, { method: 'GET' });
  },

  /**
   * Get redemption statistics for the business
   * @param {number} days - Number of days to include in stats (default: 30)
   * @returns {Promise<Object>} Redemption statistics
   */
  getRedemptionStats: async (days = 30) => {
    return apiCall(`/business/redeem/stats?days=${days}`, { method: 'GET' });
  }
};

// QR Code utility functions
export const qrUtils = {
  /**
   * Extract claim ID from various QR code formats
   * @param {string} qrContent - QR code content
   * @returns {string} Extracted claim ID
   */
  extractClaimId: (qrContent) => {
    if (!qrContent) return '';

    // Format 1: Full verification URL
    if (qrContent.includes('/verify/')) {
      try {
        return qrContent.split('/verify/')[1].split('?')[0].split('#')[0];
      } catch (e) {
        console.warn('Failed to extract claim ID from verification URL');
      }
    }

    // Format 2: URL with claim_id parameter
    if (qrContent.includes('claim_id=')) {
      try {
        return qrContent.split('claim_id=')[1].split('&')[0].split('#')[0];
      } catch (e) {
        console.warn('Failed to extract claim ID from parameter');
      }
    }

    // Format 3: JSON content
    if (qrContent.startsWith('{') && qrContent.endsWith('}')) {
      try {
        const data = JSON.parse(qrContent);
        return data.claim_id || data.id || '';
      } catch (e) {
        console.warn('Failed to parse QR JSON content');
      }
    }

    // Format 4: Plain claim ID (alphanumeric, 6-20 characters)
    if (/^[A-Z0-9]{6,20}$/.test(qrContent.trim())) {
      return qrContent.trim();
    }

    // Return original content as fallback
    return qrContent.trim();
  },

  /**
   * Validate claim ID format
   * @param {string} claimId - Claim ID to validate
   * @returns {boolean} Whether the claim ID is valid
   */
  validateClaimId: (claimId) => {
    if (!claimId || typeof claimId !== 'string') return false;
    
    const cleaned = claimId.trim().toUpperCase();
    
    // Should be 6-20 alphanumeric characters
    return /^[A-Z0-9]{6,20}$/.test(cleaned);
  }
};

// Error handling utilities - PROPERLY EXPORTED
export const redemptionErrors = {
  /**
   * Get user-friendly error message
   * @param {Error|string} error - Error object or message
   * @returns {string} User-friendly error message
   */
  getUserMessage: (error) => {
    const message = typeof error === 'string' ? error : error.message;
    
    const errorMap = {
      'AUTHENTICATION_REQUIRED': 'Please log in to continue.',
      'AUTHENTICATION_FAILED': 'Your session has expired. Please log in again.',
      'INSUFFICIENT_PERMISSIONS': 'You do not have permission to perform this action.',
      'RESOURCE_NOT_FOUND': 'The requested resource was not found.',
      'CLAIM_NOT_FOUND': 'Claim not found. Please check the claim ID and try again.',
      'ALREADY_REDEEMED': 'This offer has already been redeemed.',
      'OFFER_EXPIRED': 'This offer has expired and cannot be redeemed.',
      'UNAUTHORIZED_BUSINESS': 'This claim belongs to a different business.',
      'INVALID_CLAIM_FORMAT': 'Invalid claim ID format. Please check and try again.',
      'CAMERA_ACCESS_DENIED': 'Camera access is required to scan QR codes. Please enable camera permissions.',
      'NETWORK_ERROR': 'Network error. Please check your connection and try again.',
      'Could not validate credentials': 'Your session has expired. Please log in again.'
    };

    // Check for specific error codes
    for (const [code, userMessage] of Object.entries(errorMap)) {
      if (message.includes(code) || message.toLowerCase().includes(code.toLowerCase().replace('_', ' '))) {
        return userMessage;
      }
    }

    // Return original message if no mapping found
    return message || 'An unexpected error occurred. Please try again.';
  },

  /**
   * Check if error requires re-authentication
   * @param {Error|string} error - Error object or message
   * @returns {boolean} Whether the user should be logged out
   */
  requiresReauth: (error) => {
    const message = typeof error === 'string' ? error : error.message;
    
    const reauthErrors = [
      'AUTHENTICATION_REQUIRED',
      'AUTHENTICATION_FAILED',
      'INSUFFICIENT_PERMISSIONS',
      'Could not validate credentials'
    ];

    return reauthErrors.some(code => 
      message.includes(code) || message.toLowerCase().includes(code.toLowerCase().replace('_', ' '))
    );
  },

  /**
   * Check if error is recoverable (user can retry)
   * @param {Error|string} error - Error object or message
   * @returns {boolean} Whether the error is recoverable
   */
  isRecoverable: (error) => {
    const message = typeof error === 'string' ? error : error.message;
    
    const nonRecoverableErrors = [
      'ALREADY_REDEEMED',
      'OFFER_EXPIRED',
      'UNAUTHORIZED_BUSINESS',
      'AUTHENTICATION_FAILED',
      'INSUFFICIENT_PERMISSIONS'
    ];

    return !nonRecoverableErrors.some(code => 
      message.includes(code) || message.toLowerCase().includes(code.toLowerCase().replace('_', ' '))
    );
  }
};

// Export everything as default for convenience
export default {
  redemptionApi,
  qrUtils,
  redemptionErrors
};

