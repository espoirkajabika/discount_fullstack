import axios from 'axios'
import { API_BASE_URL } from './utils'

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
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
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
  
  // Categories
  categories: '/categories',
  
  // Products
  searchProducts: '/customer/search/products',
  
  // Offers
  searchOffers: '/customer/search/offers',
  trendingOffers: '/customer/offers/trending',
  expiringOffers: '/customer/offers/expiring-soon',
  saveOffer: (id) => `/customer/offers/${id}/save`,
  claimOffer: (id) => `/customer/offers/${id}/claim`,
  offerStatus: (id) => `/customer/offers/${id}/status`,
  
  // User actions
  savedOffers: '/customer/saved-offers',
  claimedOffers: '/customer/claimed-offers',
  
  // Businesses
  businesses: '/customer/businesses'
}