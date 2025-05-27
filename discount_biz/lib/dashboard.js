// lib/api/dashboard.js
import { apiRequest } from './base';

export const dashboardApi = {
  // Check if user is a business user first
  async checkUserStatus() {
    const response = await apiRequest('/auth/me');
    
    if (response.error) {
      console.warn('Failed to check user status:', response.message);
      return {
        user: null,
        isBusiness: false,
        isAuthenticated: false,
        error: response.message
      };
    }

    return {
      user: response.data || response,
      isBusiness: response.data?.is_business || response.is_business || false,
      isAuthenticated: true,
      error: null
    };
  },

  // Get dashboard statistics (safe version)
  async getStats() {
    // First check if user is a business user
    const userStatus = await this.checkUserStatus();
    
    if (!userStatus.isAuthenticated) {
      return {
        totalProducts: 0,
        totalOffers: 0,
        totalClaims: 0,
        activeOffers: 0,
        business: null,
        authError: true,
        user: null,
        error: userStatus.error
      };
    }

    if (!userStatus.isBusiness) {
      return {
        totalProducts: 0,
        totalOffers: 0,
        totalClaims: 0,
        activeOffers: 0,
        business: null,
        needsBusinessRegistration: true,
        user: userStatus.user,
        error: null
      };
    }

    // User is a business user, proceed with business API calls
    const [productsResponse, offersResponse] = await Promise.allSettled([
      apiRequest('/business/products?page=1&limit=1'),
      apiRequest('/business/offers?page=1&limit=1')
    ]);

    // Handle products data safely
    let totalProducts = 0;
    if (productsResponse.status === 'fulfilled' && !productsResponse.value.error) {
      const productsData = productsResponse.value.data || productsResponse.value;
      totalProducts = productsData?.pagination?.total || 0;
    }

    // Handle offers data safely
    let totalOffers = 0;
    let activeOffers = 0;
    let totalClaims = 0;

    if (offersResponse.status === 'fulfilled' && !offersResponse.value.error) {
      const offersData = offersResponse.value.data || offersResponse.value;
      totalOffers = offersData?.pagination?.total || 0;

      // Get more detailed offers data for active count and claims
      const detailedOffersResponse = await apiRequest('/business/offers?page=1&limit=100');
      if (!detailedOffersResponse.error) {
        const detailedData = detailedOffersResponse.data || detailedOffersResponse;
        const offers = detailedData?.offers || [];
        
        if (Array.isArray(offers)) {
          const now = new Date();
          
          activeOffers = offers.filter(offer => {
            try {
              return offer.is_active && 
                     new Date(offer.expiry_date) > now &&
                     new Date(offer.start_date) <= now;
            } catch (e) {
              return false;
            }
          }).length;

          totalClaims = offers.reduce((sum, offer) => {
            try {
              return sum + (parseInt(offer.current_claims) || 0);
            } catch (e) {
              return sum;
            }
          }, 0);
        }
      }
    }

    // Try to get business profile safely
    let business = null;
    const businessResponse = await apiRequest('/business/profile');
    if (!businessResponse.error) {
      const businessData = businessResponse.data || businessResponse;
      business = businessData?.business || null;
    }

    return {
      totalProducts,
      totalOffers,
      totalClaims,
      activeOffers,
      business,
      needsBusinessRegistration: !business,
      user: userStatus.user,
      error: null
    };
  },

  // Get recent activity (safe version)
  async getRecentActivity() {
    // Check user status first
    const userStatus = await this.checkUserStatus();
    
    if (!userStatus.isBusiness) {
      return {
        recentProducts: [],
        recentOffers: [],
        needsBusinessRegistration: true,
        error: null
      };
    }

    const [productsResponse, offersResponse] = await Promise.allSettled([
      apiRequest('/business/products?page=1&limit=5&sortBy=created_at&sortOrder=desc'),
      apiRequest('/business/offers?page=1&limit=5&sortBy=created_at&sortOrder=desc')
    ]);

    let recentProducts = [];
    let recentOffers = [];

    if (productsResponse.status === 'fulfilled' && !productsResponse.value.error) {
      const productsData = productsResponse.value.data || productsResponse.value;
      recentProducts = productsData?.products || [];
    }

    if (offersResponse.status === 'fulfilled' && !offersResponse.value.error) {
      const offersData = offersResponse.value.data || offersResponse.value;
      recentOffers = offersData?.offers || [];
    }

    return {
      recentProducts: Array.isArray(recentProducts) ? recentProducts : [],
      recentOffers: Array.isArray(recentOffers) ? recentOffers : [],
      error: null
    };
  },

  // Get business profile completion status (safe version)
  async getProfileStatus() {
    // Check user status first
    const userStatus = await this.checkUserStatus();
    
    if (!userStatus.isAuthenticated) {
      return {
        isComplete: false,
        completionPercentage: 0,
        missingFields: ['Authentication required'],
        business: null,
        authError: true,
        user: null
      };
    }

    if (!userStatus.isBusiness) {
      return {
        isComplete: false,
        completionPercentage: 0,
        missingFields: ['Business registration required'],
        business: null,
        needsBusinessRegistration: true,
        user: userStatus.user
      };
    }

    const response = await apiRequest('/business/profile');
    
    if (response.error) {
      // Handle different error types
      if (response.status === 404) {
        return {
          isComplete: false,
          completionPercentage: 0,
          missingFields: ['Business profile setup required'],
          business: null,
          needsBusinessSetup: true,
          user: userStatus.user
        };
      }

      if (response.status === 403) {
        return {
          isComplete: false,
          completionPercentage: 0,
          missingFields: ['Business registration required'],
          business: null,
          needsBusinessRegistration: true,
          user: userStatus.user
        };
      }

      return {
        isComplete: false,
        completionPercentage: 0,
        missingFields: ['Unable to check profile status'],
        business: null,
        error: response.message,
        user: userStatus.user
      };
    }

    const responseData = response.data || response;
    const business = responseData?.business;
    
    if (!business) {
      return {
        isComplete: false,
        completionPercentage: 0,
        missingFields: ['Business profile setup required'],
        business: null,
        needsBusinessSetup: true,
        user: userStatus.user
      };
    }

    // Check required fields for profile completion
    const requiredFields = [
      'business_name',
      'business_description', 
      'business_address',
      'phone_number',
      'category_id'
    ];

    const completedFields = requiredFields.filter(field => {
      try {
        const value = business[field];
        return value && value.toString().trim() !== '';
      } catch (e) {
        return false;
      }
    });

    const completionPercentage = Math.round((completedFields.length / requiredFields.length) * 100);
    const missingFields = requiredFields.filter(field => {
      try {
        const value = business[field];
        return !value || value.toString().trim() === '';
      } catch (e) {
        return true;
      }
    });

    const fieldNames = {
      business_name: 'Business name',
      business_description: 'Business description',
      business_address: 'Business address', 
      phone_number: 'Phone number',
      category_id: 'Business category'
    };

    return {
      isComplete: completionPercentage === 100,
      completionPercentage,
      missingFields: missingFields.map(field => fieldNames[field] || field),
      business,
      user: userStatus.user,
      error: null
    };
  },

  // Register user as business (safe version)
  async registerAsBusiness(businessData) {
    const response = await apiRequest('/business/register', {
      method: 'POST',
      body: JSON.stringify(businessData)
    });

    if (response.error) {
      return {
        success: false,
        error: response.message || 'Business registration failed'
      };
    }

    const responseData = response.data || response;
    return {
      success: true,
      business: responseData?.business,
      message: 'Business registration successful'
    };
  }
};