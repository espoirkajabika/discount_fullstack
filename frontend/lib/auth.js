// lib/auth.js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'

/**
 * Get stored authentication token
 */
export function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

/**
 * Get stored user data
 */
export function getUser() {
  if (typeof window === 'undefined') return null
  const userStr = localStorage.getItem('auth_user')
  return userStr ? JSON.parse(userStr) : null
}

/**
 * Store authentication data
 */
export function setAuthData(token, user) {
  if (typeof window === 'undefined') return
  localStorage.setItem('auth_token', token)
  localStorage.setItem('auth_user', JSON.stringify(user))
}

/**
 * Clear authentication data
 */
export function clearAuthData() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!getToken()
}

/**
 * Make authenticated API request
 */
export async function makeAuthenticatedRequest(endpoint, options = {}) {
  const token = getToken()
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
  
  // Handle 401 - token expired
  if (response.status === 401) {
    clearAuthData()
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login'
    }
    return null
  }

  return response
}

/**
 * Sign up user (general)
 */
export async function signUp(userData) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })

    const data = await response.json()

    if (!response.ok) {
      if (data.detail) {
        if (Array.isArray(data.detail)) {
          const errorMessages = data.detail.map(err => {
            const field = err.loc ? err.loc[err.loc.length - 1] : 'field'
            return `${field}: ${err.msg}`
          }).join(', ')
          return { error: `Validation errors - ${errorMessages}` }
        } else {
          return { error: data.detail }
        }
      }
      return { error: data.message || 'Registration failed' }
    }

    setAuthData(data.access_token, data.user)
    return { success: true, user: data.user }
  } catch (error) {
    console.error('Sign up error:', error)
    return { error: 'Network error. Please try again.' }
  }
}

/**
 * Register business user specifically
 */
export async function registerBusiness(businessData) {
  try {
    // Add is_business flag to the data
    const userData = {
      ...businessData,
      is_business: true
    }

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })

    const data = await response.json()

    if (!response.ok) {
      if (data.detail) {
        if (Array.isArray(data.detail)) {
          const errorMessages = data.detail.map(err => {
            const field = err.loc ? err.loc[err.loc.length - 1] : 'field'
            return `${field}: ${err.msg}`
          }).join(', ')
          return { error: `Validation errors - ${errorMessages}` }
        } else {
          return { error: data.detail }
        }
      }
      return { error: data.message || 'Registration failed' }
    }

    setAuthData(data.access_token, data.user)
    return { success: true, user: data.user }
  } catch (error) {
    console.error('Business registration error:', error)
    return { error: 'Network error. Please try again.' }
  }
}

/**
 * Register customer user specifically
 */
export async function registerCustomer(customerData) {
  try {
    // Add is_business flag as false
    const userData = {
      ...customerData,
      is_business: false
    }

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })

    const data = await response.json()

    if (!response.ok) {
      if (data.detail) {
        if (Array.isArray(data.detail)) {
          const errorMessages = data.detail.map(err => {
            const field = err.loc ? err.loc[err.loc.length - 1] : 'field'
            return `${field}: ${err.msg}`
          }).join(', ')
          return { error: `Validation errors - ${errorMessages}` }
        } else {
          return { error: data.detail }
        }
      }
      return { error: data.message || 'Registration failed' }
    }

    setAuthData(data.access_token, data.user)
    return { success: true, user: data.user }
  } catch (error) {
    console.error('Customer registration error:', error)
    return { error: 'Network error. Please try again.' }
  }
}

/**
 * Sign in user
 */
export async function signIn(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      // Handle different error formats more gracefully
      let errorMessage = 'Invalid credentials'
      
      if (data.detail) {
        if (typeof data.detail === 'string') {
          errorMessage = data.detail
        } else if (Array.isArray(data.detail)) {
          errorMessage = data.detail.map(err => err.msg || err).join(', ')
        }
      } else if (data.message) {
        errorMessage = data.message
      }
      
      return { error: errorMessage }
    }

    setAuthData(data.access_token, data.user)
    return { success: true, user: data.user, token: data.access_token }
  } catch (error) {
    console.error('Sign in error:', error)
    return { error: 'Network error. Please try again.' }
  }
}

/**
 * Sign out user
 */
export async function signOut() {
  try {
    const token = getToken()
    
    if (token) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
    }
  } catch (error) {
    console.error('Sign out error:', error)
  } finally {
    clearAuthData()
  }
}