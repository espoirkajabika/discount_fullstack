'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { 
  getCurrentUser, 
  getCurrentToken, 
  isAuthenticated, 
  isBusinessUser, 
  isShopperUser,
  signOut as authSignOut,
  getUserProfile,
  refreshToken,
  clearSession
} from '@/lib/auth'

// Create the context
const AuthContext = createContext({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  isBusinessUser: false,
  isShopperUser: false,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  checkAuth: () => {},
})

// Auth provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Derived state
  const authenticated = isAuthenticated()
  const businessUser = isBusinessUser()
  const shopperUser = isShopperUser()

  /**
   * Initialize auth state from localStorage
   */
  const initializeAuth = useCallback(() => {
    try {
      const storedUser = getCurrentUser()
      const storedToken = getCurrentToken()

      if (storedUser && storedToken) {
        setUser(storedUser)
        setToken(storedToken)
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
      clearSession()
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Login function - called after successful authentication
   */
  const login = useCallback((userData, tokenData = null) => {
    setUser(userData)
    if (tokenData) {
      setToken(tokenData)
    }
  }, [])

  /**
   * Logout function
   */
  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await authSignOut()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setToken(null)
      setIsLoading(false)
      // Redirect to home page
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    }
  }, [])

  /**
   * Update user data
   */
  const updateUser = useCallback((userData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...userData
    }))
  }, [])

  /**
   * Check authentication status and refresh if needed
   */
  const checkAuth = useCallback(async () => {
    if (!token) return false

    try {
      // Try to get fresh user data from server
      const result = await getUserProfile()
      
      if (result.user) {
        setUser(result.user)
        return true
      } else {
        // If failed, try to refresh token
        const refreshResult = await refreshToken()
        
        if (refreshResult.token) {
          setToken(refreshResult.token)
          // Retry getting user profile
          const retryResult = await getUserProfile()
          if (retryResult.user) {
            setUser(retryResult.user)
            return true
          }
        }
        
        // If all fails, clear session
        logout()
        return false
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      logout()
      return false
    }
  }, [token, logout])

  /**
   * Auto-refresh token before expiration
   */
  const setupTokenRefresh = useCallback(() => {
    if (!token || !user) return

    // Refresh token every 25 minutes (tokens expire in 30 minutes)
    const refreshInterval = setInterval(async () => {
      try {
        const result = await refreshToken()
        if (result.token) {
          setToken(result.token)
        } else {
          clearInterval(refreshInterval)
          logout()
        }
      } catch (error) {
        console.error('Auto refresh failed:', error)
        clearInterval(refreshInterval)
        logout()
      }
    }, 25 * 60 * 1000) // 25 minutes

    return () => clearInterval(refreshInterval)
  }, [token, user, logout])

  /**
   * Handle route protection
   */
  const requireAuth = useCallback((requiredUserType = null) => {
    if (!authenticated) {
      return { 
        isAllowed: false, 
        redirectTo: '/' 
      }
    }

    if (requiredUserType === 'business' && !businessUser) {
      return { 
        isAllowed: false, 
        redirectTo: '/business/auth/signin' 
      }
    }

    if (requiredUserType === 'shopper' && !shopperUser) {
      return { 
        isAllowed: false, 
        redirectTo: '/shoppers/auth/signin' 
      }
    }

    return { 
      isAllowed: true, 
      redirectTo: null 
    }
  }, [authenticated, businessUser, shopperUser])

  /**
   * Handle page access for authenticated users
   */
  const redirectIfAuthenticated = useCallback(() => {
    if (authenticated) {
      if (businessUser) {
        return '/business/dashboard'
      } else if (shopperUser) {
        return '/shoppers/dashboard'
      }
    }
    return null
  }, [authenticated, businessUser, shopperUser])

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  // Setup token refresh when authenticated
  useEffect(() => {
    if (authenticated && token) {
      return setupTokenRefresh()
    }
  }, [authenticated, token, setupTokenRefresh])

  // Handle browser tab visibility changes to check auth
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && authenticated) {
        checkAuth()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [authenticated, checkAuth])

  // Context value
  const contextValue = {
    // State
    user,
    token,
    isLoading,
    isAuthenticated: authenticated,
    isBusinessUser: businessUser,
    isShopperUser: shopperUser,
    
    // Actions
    login,
    logout,
    updateUser,
    checkAuth,
    
    // Utilities
    requireAuth,
    redirectIfAuthenticated,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

// HOC for protected routes
export function withAuth(Component, requiredUserType = null) {
  return function AuthenticatedComponent(props) {
    const { requireAuth, isLoading } = useAuth()
    const [checking, setChecking] = useState(true)

    useEffect(() => {
      const checkAccess = async () => {
        if (isLoading) return

        const authCheck = requireAuth(requiredUserType)
        
        if (!authCheck.isAllowed && authCheck.redirectTo) {
          window.location.href = authCheck.redirectTo
          return
        }
        
        setChecking(false)
      }

      checkAccess()
    }, [isLoading, requireAuth])

    if (isLoading || checking) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e3a5f] via-[#2a4d6e] to-[#1e3a5f]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading...</p>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
}

// HOC to redirect authenticated users away from auth pages
export function withGuestOnly(Component) {
  return function GuestOnlyComponent(props) {
    const { redirectIfAuthenticated, isLoading } = useAuth()
    const [checking, setChecking] = useState(true)

    useEffect(() => {
      if (isLoading) return

      const redirectTo = redirectIfAuthenticated()
      if (redirectTo) {
        window.location.href = redirectTo
        return
      }
      
      setChecking(false)
    }, [isLoading, redirectIfAuthenticated])

    if (isLoading || checking) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e3a5f] via-[#2a4d6e] to-[#1e3a5f]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading...</p>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
}

export default AuthContext