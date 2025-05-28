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
  
  // Customer endpoints
  searchProducts: '/customer/search/products',
  searchOffers: '/customer/search/offers',
  trendingOffers: '/customer/offers/trending',
  expiringOffers: '/customer/offers/expiring-soon',
  saveOffer: (id) => `/customer/offers/${id}/save`,
  claimOffer: (id) => `/customer/offers/${id}/claim`,
  offerStatus: (id) => `/customer/offers/${id}/status`,
  savedOffers: '/customer/saved-offers',
  claimedOffers: '/customer/claimed-offers',
  businesses: '/customer/businesses'
}