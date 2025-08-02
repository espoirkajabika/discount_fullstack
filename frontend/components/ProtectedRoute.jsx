'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function ProtectedRoute({ 
  children, 
  requiredUserType = null, // 'business' | 'shopper' | null
  fallbackComponent = null 
}) {
  const router = useRouter()
  const { isLoading, isAuthenticated, isBusinessUser, isShopperUser } = useAuth()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (isLoading) return

    // Check if user is authenticated
    if (!isAuthenticated) {
      router.push('/')
      return
    }

    // Check user type requirements
    if (requiredUserType === 'business' && !isBusinessUser) {
      router.push('/business/auth/signin')
      return
    }

    if (requiredUserType === 'shopper' && !isShopperUser) {
      router.push('/shoppers/auth/signin')
      return
    }

    // User is authorized
    setIsAuthorized(true)
  }, [isLoading, isAuthenticated, isBusinessUser, isShopperUser, requiredUserType, router])

  // Show loading state
  if (isLoading || !isAuthorized) {
    return fallbackComponent || (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e3a5f] via-[#2a4d6e] to-[#1e3a5f]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg">Verifying access...</p>
        </div>
      </div>
    )
  }

  return children
}

// Convenience components for specific user types
export function BusinessRoute({ children, fallbackComponent = null }) {
  return (
    <ProtectedRoute requiredUserType="business" fallbackComponent={fallbackComponent}>
      {children}
    </ProtectedRoute>
  )
}

export function ShopperRoute({ children, fallbackComponent = null }) {
  return (
    <ProtectedRoute requiredUserType="shopper" fallbackComponent={fallbackComponent}>
      {children}
    </ProtectedRoute>
  )
}