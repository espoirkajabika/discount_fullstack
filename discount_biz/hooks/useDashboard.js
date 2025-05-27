// hooks/useDashboard.js
import { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from '@/lib/dashboard';

export const useDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOffers: 0,
    totalClaims: 0,
    activeOffers: 0,
    business: null,
    needsBusinessRegistration: false,
    user: null
  });
  
  const [profileStatus, setProfileStatus] = useState({
    isComplete: false,
    completionPercentage: 0,
    missingFields: [],
    business: null,
    needsBusinessRegistration: false,
    user: null
  });
  
  const [recentActivity, setRecentActivity] = useState({
    recentProducts: [],
    recentOffers: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, profileData, activityData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getProfileStatus(),
        dashboardApi.getRecentActivity()
      ]);

      setStats(statsData);
      setProfileStatus(profileData);
      setRecentActivity(activityData);

      // Check for authentication errors
      if (statsData.authError) {
        setError('Please log in again to access your dashboard');
        return;
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const refreshStats = useCallback(async () => {
    try {
      const statsData = await dashboardApi.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error refreshing stats:', err);
    }
  }, []);

  const refreshProfileStatus = useCallback(async () => {
    try {
      const profileData = await dashboardApi.getProfileStatus();
      setProfileStatus(profileData);
    } catch (err) {
      console.error('Error refreshing profile status:', err);
    }
  }, []);

  return {
    stats,
    profileStatus,
    recentActivity,
    loading,
    error,
    refresh: fetchDashboardData,
    refreshStats,
    refreshProfileStatus
  };
};