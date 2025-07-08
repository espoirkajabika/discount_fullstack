// lib/offersApi.js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';

class OffersAPI {
  // Search offers near coordinates
  static async searchNearby(latitude, longitude, options = {}) {
    try {
      const params = new URLSearchParams({
        lat: latitude.toString(),
        lng: longitude.toString(),
        radius: (options.radius || 10).toString(),
        limit: (options.limit || 20).toString()
      });

      if (options.categoryId) {
        params.append('category_id', options.categoryId);
      }

      const response = await fetch(`${API_BASE_URL}/customer/offers/nearby?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.offers || [],
        searchLocation: data.search_location,
        totalFound: data.total_found || 0,
        searchRadius: data.search_radius_km || options.radius || 10
      };
    } catch (error) {
      console.error('Nearby offers search error:', error);
      return {
        success: false,
        error: error.message || 'Failed to search nearby offers',
        data: []
      };
    }
  }

  // Search offers by address
  static async searchByAddress(address, options = {}) {
    try {
      const params = new URLSearchParams({
        radius: (options.radius || 10).toString(),
        limit: (options.limit || 20).toString()
      });

      if (options.categoryId) {
        params.append('category_id', options.categoryId);
      }

      const response = await fetch(`${API_BASE_URL}/customer/offers/search-by-address?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.offers || [],
        searchAddress: data.search_address,
        geocodedLocation: data.geocoded_location,
        totalFound: data.total_found || 0,
        searchRadius: data.search_radius_km || options.radius || 10
      };
    } catch (error) {
      console.error('Address search error:', error);
      return {
        success: false,
        error: error.message || 'Failed to search by address',
        data: []
      };
    }
  }

  // Get categories with active offers
  static async getCategories() {
    try {
      const response = await fetch(`${API_BASE_URL}/customer/offers/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.categories || []
      };
    } catch (error) {
      console.error('Categories fetch error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch categories',
        data: []
      };
    }
  }

  // Claim an offer (for future implementation)
  static async claimOffer(offerId, claimType = 'online') {
    try {
      const response = await fetch(`${API_BASE_URL}/customer/offers/${offerId}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`, // Assuming you store auth token
        },
        body: JSON.stringify({ claim_type: claimType }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Claim offer error:', error);
      return {
        success: false,
        error: error.message || 'Failed to claim offer'
      };
    }
  }
}

// Geocoding utility for address search
export class GeocodingAPI {
  static async geocodeAddress(address) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        return {
          success: true,
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
          formatted_address: result.formatted_address,
          place_id: result.place_id
        };
      }
      
      return {
        success: false,
        error: 'Address not found'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Geocoding service unavailable'
      };
    }
  }
}

export default OffersAPI;