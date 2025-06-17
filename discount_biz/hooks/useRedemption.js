// hooks/useRedemption.js
'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { redemptionApi, redemptionErrors } from '@/lib/redemptionApi';

export const useRedemption = () => {
  const { logout } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [claimDetails, setClaimDetails] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const clearMessages = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  const handleAuthError = useCallback((error) => {
    if (redemptionErrors.requiresReauth(error)) {
      logout();
      return true;
    }
    return false;
  }, [logout]);

  const verifyClaim = useCallback(async (claimIdentifier, verificationType = 'claim_id') => {
    setIsVerifying(true);
    setError('');
    setClaimDetails(null);
    
    try {
      const response = await redemptionApi.verifyClaim(claimIdentifier, verificationType);
      
      if (response.is_valid) {
        setClaimDetails(response.claim_details);
        setSuccess('');
        return { success: true, data: response.claim_details };
      } else {
        const errorMessage = redemptionErrors.getUserMessage(response.error_message || 'Invalid claim');
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      if (handleAuthError(err)) {
        return { success: false, error: 'Authentication required', needsAuth: true };
      }
      
      const errorMessage = redemptionErrors.getUserMessage(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsVerifying(false);
    }
  }, [handleAuthError]);

  const redeemClaim = useCallback(async (claimId, notes = '') => {
    setIsRedeeming(true);
    setError('');
    
    try {
      const response = await redemptionApi.redeemClaim(claimId, notes);
      
      if (response.success) {
        setSuccess(`Successfully redeemed claim ${claimId}!`);
        setClaimDetails(null);
        
        // Auto-clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
        
        return { success: true, data: response.redemption_details };
      } else {
        const errorMessage = redemptionErrors.getUserMessage(response.message || 'Failed to redeem claim');
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      if (handleAuthError(err)) {
        return { success: false, error: 'Authentication required', needsAuth: true };
      }
      
      const errorMessage = redemptionErrors.getUserMessage(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsRedeeming(false);
    }
  }, [handleAuthError]);

  const reset = useCallback(() => {
    setClaimDetails(null);
    setError('');
    setSuccess('');
    setIsVerifying(false);
    setIsRedeeming(false);
  }, []);

  const getRedemptionHistory = useCallback(async (params = {}) => {
    try {
      const response = await redemptionApi.getRedemptionHistory(params);
      return { success: true, data: response };
    } catch (err) {
      if (handleAuthError(err)) {
        return { success: false, error: 'Authentication required', needsAuth: true };
      }
      
      const errorMessage = redemptionErrors.getUserMessage(err);
      return { success: false, error: errorMessage };
    }
  }, [handleAuthError]);

  const getRedemptionStats = useCallback(async (days = 30) => {
    try {
      const response = await redemptionApi.getRedemptionStats(days);
      return { success: true, data: response };
    } catch (err) {
      if (handleAuthError(err)) {
        return { success: false, error: 'Authentication required', needsAuth: true };
      }
      
      const errorMessage = redemptionErrors.getUserMessage(err);
      return { success: false, error: errorMessage };
    }
  }, [handleAuthError]);

  return {
    // State
    isVerifying,
    isRedeeming,
    claimDetails,
    error,
    success,
    
    // Actions
    verifyClaim,
    redeemClaim,
    reset,
    clearMessages,
    getRedemptionHistory,
    getRedemptionStats,
    
    // Utilities
    isError: !!error,
    isSuccess: !!success,
    hasClaimDetails: !!claimDetails,
    canRetry: error ? redemptionErrors.isRecoverable(error) : true
  };
};

export default useRedemption;

