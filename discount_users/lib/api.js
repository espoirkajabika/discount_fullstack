// lib/api.js
import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// API endpoints
export const endpoints = {
  // Existing endpoints...
  login: "/auth/login",
  register: "/auth/register",
  me: "/auth/me",
  logout: "/auth/logout",

  // Categories
  categories: "/categories",
  category: (id) => `/categories/${id}`,

  // Products & Offers
  searchProducts: "/customer/search/products",
  searchOffers: "/customer/search/offers",
  trendingOffers: "/customer/offers/trending",
  expiringOffers: "/customer/offers/expiring-soon",

  // Enhanced claim endpoints
  claimOffer: (id) => `/customer/offers/${id}/claim`,
  claimedOffers: "/customer/claimed-offers",
  claimQRCode: (claimId) => `/customer/claimed-offers/${claimId}/qr`,
  offerStatus: (id) => `/customer/offers/${id}/status`,

  // Save/Unsave offers
  saveOffer: (id) => `/customer/offers/${id}/save`,
  savedOffers: "/customer/saved-offers",

  // Business discovery
  businesses: "/customer/businesses",
  business: (id) => `/businesses/${id}`,
};

// Helper function to get full image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;

  // If it's already a full URL, return as-is
  if (imagePath.startsWith("http")) return imagePath;

  // If it's a relative path, construct full URL
  const baseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://your-supabase-url.supabase.co";
  return `${baseUrl}/storage/v1/object/public/product-images/${imagePath}`;
};

// API helper functions
export const apiHelpers = {
  // Get products with images
  async getProducts(params = {}) {
    try {
      const response = await api.get(endpoints.searchProducts, { params });
      const products = response.data.products || [];

      // Ensure image URLs are properly formatted
      return {
        ...response.data,
        products: products.map((product) => ({
          ...product,
          image_url: getImageUrl(product.image_url),
        })),
      };
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  },

  // Get offers with images
  async getOffers(params = {}) {
    try {
      const response = await api.get(endpoints.searchOffers, { params });
      const offers = response.data.offers || [];

      // Ensure image URLs are properly formatted for offers and their products
      return {
        ...response.data,
        offers: offers.map((offer) => ({
          ...offer,
          image_url: getImageUrl(offer.image_url),
          product: offer.product
            ? {
                ...offer.product,
                image_url: getImageUrl(offer.product.image_url),
              }
            : null,
          products: offer.products
            ? {
                ...offer.products,
                image_url: getImageUrl(offer.products.image_url),
              }
            : null,
        })),
      };
    } catch (error) {
      console.error("Error fetching offers:", error);
      throw error;
    }
  },

  // Get trending offers
  async getTrendingOffers(limit = 10) {
    try {
      const response = await api.get(
        `${endpoints.trendingOffers}?limit=${limit}`
      );
      const offers = response.data.offers || [];

      return {
        ...response.data,
        offers: offers.map((offer) => {
          const processedOffer = {
            ...offer,
            image_url: getImageUrl(offer.image_url),
          };

          // Handle product images - backend returns 'products' (plural)
          if (offer.products) {
            processedOffer.products = {
              ...offer.products,
              image_url: getImageUrl(offer.products.image_url),
            };
          }

          return processedOffer;
        }),
      };
    } catch (error) {
      console.error("Error fetching trending offers:", error);
      throw error;
    }
  },

  // Get expiring offers
  async getExpiringOffers(hours = 24, limit = 10) {
    try {
      const response = await api.get(
        `${endpoints.expiringOffers}?hours=${hours}&limit=${limit}`
      );
      const offers = response.data.offers || [];

      return {
        ...response.data,
        offers: offers.map((offer) => ({
          ...offer,
          image_url: getImageUrl(offer.image_url),
          product: offer.product
            ? {
                ...offer.product,
                image_url: getImageUrl(offer.product.image_url),
              }
            : null,
          products: offer.products
            ? {
                ...offer.products,
                image_url: getImageUrl(offer.products.image_url),
              }
            : null,
        })),
      };
    } catch (error) {
      console.error("Error fetching expiring offers:", error);
      throw error;
    }
  },

  // Get single product with image
  async getProduct(id) {
    try {
      const response = await api.get(endpoints.product(id));
      const product = response.data.product || response.data;

      return {
        ...product,
        image_url: getImageUrl(product.image_url),
      };
    } catch (error) {
      console.error("Error fetching product:", error);
      throw error;
    }
  },

  // Get single offer with image
  async getOffer(id) {
    try {
      const response = await api.get(endpoints.offer(id));
      const offer = response.data.offer || response.data;

      return {
        ...offer,
        image_url: getImageUrl(offer.image_url),
        product: offer.product
          ? {
              ...offer.product,
              image_url: getImageUrl(offer.product.image_url),
            }
          : null,
        products: offer.products
          ? {
              ...offer.products,
              image_url: getImageUrl(offer.products.image_url),
            }
          : null,
      };
    } catch (error) {
      console.error("Error fetching offer:", error);
      throw error;
    }
  },

  async claimOffer(offerId, claimData) {
    try {
      const response = await api.post(endpoints.claimOffer(offerId), claimData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error claiming offer:", error);
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to claim offer",
      };
    }
  },

  // Get claimed offers with filtering
  async getClaimedOffers(params = {}) {
    try {
      const response = await api.get(endpoints.claimedOffers, { params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error fetching claimed offers:", error);
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to fetch claimed offers",
      };
    }
  },

  // Get QR code for a claim
  async getClaimQRCode(claimId) {
    try {
      const response = await api.get(endpoints.claimQRCode(claimId));
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error fetching QR code:", error);
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to fetch QR code",
      };
    }
  },

  // Get offer status including claim info
  async getOfferStatus(offerId) {
    try {
      const response = await api.get(endpoints.offerStatus(offerId));
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error fetching offer status:", error);
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to fetch offer status",
      };
    }
  },

  // Enhanced save offer
  async saveOffer(offerId) {
    try {
      const response = await api.post(endpoints.saveOffer(offerId));
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error saving offer:", error);
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to save offer",
      };
    }
  },

  // Enhanced unsave offer
  async unsaveOffer(offerId) {
    try {
      const response = await api.delete(endpoints.saveOffer(offerId));
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error unsaving offer:", error);
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to unsave offer",
      };
    }
  },
};

// Utility functions for claim management
export const claimUtils = {
  // Format claim type for display
  formatClaimType(claimType) {
    return claimType === "in_store" ? "In-Store" : "Online";
  },

  // Get claim status display
  getClaimStatusDisplay(claim) {
    if (claim.is_redeemed) {
      return {
        status: "Redeemed",
        color: "success",
        icon: "✅",
      };
    }

    if (claim.claim_type === "online") {
      return {
        status: "Pending Online",
        color: "warning",
        icon: "🌐",
      };
    }

    return {
      status: "Ready for Pickup",
      color: "info",
      icon: "🏪",
    };
  },

  // Validate claim quantity
  validateClaimQuantity(quantity, maxClaims, currentClaims) {
    if (!quantity || quantity < 1) {
      return { valid: false, error: "Quantity must be at least 1" };
    }

    if (maxClaims && currentClaims + quantity > maxClaims) {
      const available = maxClaims - currentClaims;
      return {
        valid: false,
        error: `Only ${available} claims remaining`,
      };
    }

    return { valid: true };
  },

  // Get time remaining for offer
  getTimeRemaining(expiryDate) {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry - now;

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} left`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} left`;
    return "Expires soon";
  },

  // Format merchant address
  formatMerchantAddress(address) {
    if (!address) return "Address not available";
    return address;
  },

  // Parse business hours
  parseBusinessHours(businessHours) {
    if (!businessHours) return "Hours not available";

    // Handle different formats of business hours
    if (typeof businessHours === "string") {
      return businessHours;
    }

    if (typeof businessHours === "object") {
      // Convert object format to readable string
      const days = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];
      const formatted = days
        .filter((day) => businessHours[day])
        .map(
          (day) =>
            `${day.charAt(0).toUpperCase() + day.slice(1)}: ${
              businessHours[day]
            }`
        )
        .join("\n");

      return formatted || "Hours not available";
    }

    return "Hours not available";
  },
};
