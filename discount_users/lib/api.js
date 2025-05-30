// lib/api.js
import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// API endpoints
export const endpoints = {
  // Auth
  login: '/auth/login',
  register: '/auth/register',
  me: '/auth/me',
  logout: '/auth/logout',
  
  // Categories
  categories: '/categories',
  category: (id) => `/categories/${id}`,
  
  // Products
  products: '/customer/search/products',
  product: (id) => `/products/${id}`,
  productOffers: (id) => `/products/${id}/offers`,
  
  // Offers  
  offers: '/customer/search/offers',
  offer: (id) => `/offers/${id}`,
  trendingOffers: '/customer/offers/trending',
  expiringOffers: '/customer/offers/expiring-soon',
  
  // Customer endpoints
  searchProducts: '/customer/search/products',
  searchOffers: '/customer/search/offers',
  saveOffer: (id) => `/customer/offers/${id}/save`,
  claimOffer: (id) => `/customer/offers/${id}/claim`,
  offerStatus: (id) => `/customer/offers/${id}/status`,
  savedOffers: '/customer/saved-offers',
  claimedOffers: '/customer/claimed-offers',
  businesses: '/customer/businesses',
  business: (id) => `/businesses/${id}`,
}

// Helper function to get full image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null
  
  // If it's already a full URL, return as-is
  if (imagePath.startsWith('http')) return imagePath
  
  // If it's a relative path, construct full URL
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-supabase-url.supabase.co'
  return `${baseUrl}/storage/v1/object/public/product-images/${imagePath}`
}

// API helper functions
export const apiHelpers = {
  // Get products with images
  async getProducts(params = {}) {
    try {
      const response = await api.get(endpoints.searchProducts, { params })
      const products = response.data.products || []
      
      // Ensure image URLs are properly formatted
      return {
        ...response.data,
        products: products.map(product => ({
          ...product,
          image_url: getImageUrl(product.image_url)
        }))
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    }
  },

  // Get offers with images
  async getOffers(params = {}) {
    try {
      const response = await api.get(endpoints.searchOffers, { params })
      const offers = response.data.offers || []
      
      // Ensure image URLs are properly formatted for offers and their products
      return {
        ...response.data,
        offers: offers.map(offer => ({
          ...offer,
          image_url: getImageUrl(offer.image_url),
          product: offer.product ? {
            ...offer.product,
            image_url: getImageUrl(offer.product.image_url)
          } : null,
          products: offer.products ? {
            ...offer.products,
            image_url: getImageUrl(offer.products.image_url)
          } : null
        }))
      }
    } catch (error) {
      console.error('Error fetching offers:', error)
      throw error
    }
  },

  // Get trending offers
  async getTrendingOffers(limit = 10) {
    try {
      const response = await api.get(`${endpoints.trendingOffers}?limit=${limit}`)
      const offers = response.data.offers || []
      
      return {
        ...response.data,
        offers: offers.map(offer => {
          const processedOffer = {
            ...offer,
            image_url: getImageUrl(offer.image_url)
          }
          
          // Handle product images - backend returns 'products' (plural)
          if (offer.products) {
            processedOffer.products = {
              ...offer.products,
              image_url: getImageUrl(offer.products.image_url)
            }
          }
          
          return processedOffer
        })
      }
    } catch (error) {
      console.error('Error fetching trending offers:', error)
      throw error
    }
  },

  // Get expiring offers
  async getExpiringOffers(hours = 24, limit = 10) {
    try {
      const response = await api.get(`${endpoints.expiringOffers}?hours=${hours}&limit=${limit}`)
      const offers = response.data.offers || []
      
      return {
        ...response.data,
        offers: offers.map(offer => ({
          ...offer,
          image_url: getImageUrl(offer.image_url),
          product: offer.product ? {
            ...offer.product,
            image_url: getImageUrl(offer.product.image_url)
          } : null,
          products: offer.products ? {
            ...offer.products,
            image_url: getImageUrl(offer.products.image_url)
          } : null
        }))
      }
    } catch (error) {
      console.error('Error fetching expiring offers:', error)
      throw error
    }
  },

  // Get single product with image
  async getProduct(id) {
    try {
      const response = await api.get(endpoints.product(id))
      const product = response.data.product || response.data
      
      return {
        ...product,
        image_url: getImageUrl(product.image_url)
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      throw error
    }
  },

  // Get single offer with image
  async getOffer(id) {
    try {
      const response = await api.get(endpoints.offer(id))
      const offer = response.data.offer || response.data
      
      return {
        ...offer,
        image_url: getImageUrl(offer.image_url),
        product: offer.product ? {
          ...offer.product,
          image_url: getImageUrl(offer.product.image_url)
        } : null,
        products: offer.products ? {
          ...offer.products,
          image_url: getImageUrl(offer.products.image_url)
        } : null
      }
    } catch (error) {
      console.error('Error fetching offer:', error)
      throw error
    }
  }
}