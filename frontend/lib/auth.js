// lib/auth.js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'

// Token storage keys
const BUSINESS_TOKEN_KEY = 'businessToken'
const BUSINESS_USER_KEY = 'businessUser'
const SHOPPER_TOKEN_KEY = 'shopperToken'
const SHOPPER_USER_KEY = 'shopperUser'

/**
 * Generic API request handler with automatic token management
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  // Add authorization header if token exists
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, config)
    const data = await response.json()

    if (!response.ok) {
      // Handle token expiration
      if (response.status === 401) {
        clearSession()
        throw new Error('Session expired. Please sign in again.')
      }
      throw new Error(data.detail || `HTTP error! status: ${response.status}`)
    }

    return data
  } catch (error) {
    console.error('API Request failed:', error)
    throw error
  }
}

/**
 * Get stored token based on user type
 */
function getStoredToken(userType = null) {
  if (typeof window === 'undefined') return null
  
  // If userType is specified, get that specific token
  if (userType === 'business') {
    return localStorage.getItem(BUSINESS_TOKEN_KEY)
  }
  if (userType === 'shopper') {
    return localStorage.getItem(SHOPPER_TOKEN_KEY)
  }
  
  // Otherwise, get any available token (prioritize business)
  return localStorage.getItem(BUSINESS_TOKEN_KEY) || localStorage.getItem(SHOPPER_TOKEN_KEY)
}

/**
 * Get stored user data
 */
function getStoredUser(userType = null) {
  if (typeof window === 'undefined') return null
  
  try {
    if (userType === 'business') {
      const userData = localStorage.getItem(BUSINESS_USER_KEY)
      return userData ? JSON.parse(userData) : null
    }
    if (userType === 'shopper') {
      const userData = localStorage.getItem(SHOPPER_USER_KEY)
      return userData ? JSON.parse(userData) : null
    }
    
    // Get any available user (prioritize business)
    const businessUser = localStorage.getItem(BUSINESS_USER_KEY)
    const shopperUser = localStorage.getItem(SHOPPER_USER_KEY)
    
    if (businessUser) return JSON.parse(businessUser)
    if (shopperUser) return JSON.parse(shopperUser)
    
    return null
  } catch (error) {
    console.error('Error parsing stored user data:', error)
    return null
  }
}

/**
 * Store authentication data
 */
function storeAuthData(user, token) {
  if (typeof window === 'undefined') return
  
  const userType = user.is_business ? 'business' : 'shopper'
  
  if (userType === 'business') {
    localStorage.setItem(BUSINESS_TOKEN_KEY, token)
    localStorage.setItem(BUSINESS_USER_KEY, JSON.stringify(user))
    // Clear shopper data if exists
    localStorage.removeItem(SHOPPER_TOKEN_KEY)
    localStorage.removeItem(SHOPPER_USER_KEY)
  } else {
    localStorage.setItem(SHOPPER_TOKEN_KEY, token)
    localStorage.setItem(SHOPPER_USER_KEY, JSON.stringify(user))
    // Clear business data if exists
    localStorage.removeItem(BUSINESS_TOKEN_KEY)
    localStorage.removeItem(BUSINESS_USER_KEY)
  }
}

/**
 * Clear all session data
 */
function clearSession() {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem(BUSINESS_TOKEN_KEY)
  localStorage.removeItem(BUSINESS_USER_KEY)
  localStorage.removeItem(SHOPPER_TOKEN_KEY)
  localStorage.removeItem(SHOPPER_USER_KEY)
}

/**
 * Sign in user
 */
export async function signIn(email, password) {
  try {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    // Store auth data
    storeAuthData(response.user, response.access_token)

    return {
      user: response.user,
      token: response.access_token,
      error: null,
    }
  } catch (error) {
    return {
      user: null,
      token: null,
      error: error.message,
    }
  }
}

/**
 * Register business user
 */
export async function registerBusiness(userData) {
  try {
    const response = await apiRequest('/business/register-complete', {
      method: 'POST',
      body: JSON.stringify(userData),
    })

    // Store auth data
    storeAuthData(response.user, response.access_token)

    return {
      user: response.user,
      token: response.access_token,
      error: null,
    }
  } catch (error) {
    return {
      user: null,
      token: null,
      error: error.message,
    }
  }
}

/**
 * Register shopper user
 */
export async function registerShopper(userData) {
  try {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })

    // Store auth data
    storeAuthData(response.user, response.access_token)

    return {
      user: response.user,
      token: response.access_token,
      error: null,
    }
  } catch (error) {
    return {
      user: null,
      token: null,
      error: error.message,
    }
  }
}

/**
 * Sign out user
 */
export async function signOut() {
  try {
    // Call logout endpoint
    await apiRequest('/auth/logout', {
      method: 'POST',
    })
  } catch (error) {
    console.error('Logout API call failed:', error)
    // Continue with local cleanup even if API call fails
  } finally {
    // Always clear local session
    clearSession()
  }
}

/**
 * Get current user
 */
export function getCurrentUser() {
  return getStoredUser()
}

/**
 * Get current token
 */
export function getCurrentToken() {
  return getStoredToken()
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  const token = getStoredToken()
  const user = getStoredUser()
  return !!(token && user)
}

/**
 * Check if user is business user
 */
export function isBusinessUser() {
  const user = getStoredUser()
  return user?.is_business === true
}

/**
 * Check if user is shopper
 */
export function isShopperUser() {
  const user = getStoredUser()
  return user?.is_business === false
}

/**
 * Refresh token
 */
export async function refreshToken() {
  try {
    const response = await apiRequest('/auth/refresh', {
      method: 'POST',
    })

    const user = getStoredUser()
    if (user) {
      storeAuthData(user, response.access_token)
    }

    return {
      token: response.access_token,
      error: null,
    }
  } catch (error) {
    clearSession()
    return {
      token: null,
      error: error.message,
    }
  }
}

/**
 * Update user profile
 */
export async function updateProfile(userData) {
  try {
    const response = await apiRequest('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(userData),
    })

    // Update stored user data
    const currentToken = getStoredToken()
    if (currentToken) {
      storeAuthData(response, currentToken)
    }

    return {
      user: response,
      error: null,
    }
  } catch (error) {
    return {
      user: null,
      error: error.message,
    }
  }
}

/**
 * Get user profile from server
 */
export async function getUserProfile() {
  try {
    const response = await apiRequest('/auth/me')
    
    // Update stored user data
    const currentToken = getStoredToken()
    if (currentToken) {
      storeAuthData(response, currentToken)
    }

    return {
      user: response,
      error: null,
    }
  } catch (error) {
    return {
      user: null,
      error: error.message,
    }
  }
}

/**
 * Password reset request
 */
export async function requestPasswordReset(email) {
  try {
    await apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })

    return {
      success: true,
      error: null,
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Password reset with token
 */
export async function resetPassword(token, password) {
  try {
    await apiRequest('/auth/update-password', {
      method: 'PUT',
      body: JSON.stringify({ 
        access_token: token, 
        password 
      }),
    })

    return {
      success: true,
      error: null,
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Change password for authenticated user
 */
export async function changePassword(currentPassword, newPassword) {
  try {
    await apiRequest('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ 
        current_password: currentPassword,
        new_password: newPassword 
      }),
    })

    return {
      success: true,
      error: null,
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    }
  }
}

// Export utility functions
export {
  getStoredUser,
  getStoredToken,
  clearSession,
  apiRequest,
}