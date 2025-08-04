// hooks/useBusinessAuth.js
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

/**
 * Custom hook for business authentication
 * Redirects to login if not authenticated or not a business user
 */
export function useBusinessAuth() {
  const { user, loading, login, registerBusiness, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not authenticated, redirect to business login
        router.push('/business/auth/signin')
      } else if (!user.is_business) {
        // Authenticated but not a business user
        console.warn('User is not a business account')
        router.push('/business/auth/signin')
      }
    }
  }, [user, loading, router])

  return {
    user,
    loading,
    login,
    registerBusiness,
    logout,
    isBusinessUser: user?.is_business === true,
    isAuthenticated: !!user
  }
}

// Alternative hook that doesn't redirect (for conditional rendering)
export function useBusinessAuthState() {
  const { user, loading, login, registerBusiness, logout } = useAuth()

  return {
    user,
    loading,
    login,
    registerBusiness,
    logout,
    isBusinessUser: user?.is_business === true,
    isAuthenticated: !!user,
    needsAuth: !loading && !user,
    needsBusinessAuth: !loading && user && !user.is_business
  }
}