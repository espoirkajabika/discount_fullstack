// components/auth/ProtectedRoute.js
'use client'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { brandColors } from '@/lib/colors'
import Spinner from '@/components/ui/spinner'

export default function ProtectedRoute({ children, requireAuth = true }) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && requireAuth && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, requireAuth, router])

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: brandColors.gray[50]
      }}>
        <Spinner />
      </div>
    )
  }

  // Don't render children if auth is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return null
  }

  return children
}