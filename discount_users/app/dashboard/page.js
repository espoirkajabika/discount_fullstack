// app/dashboard/page.js - Update the existing file
'use client'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import { brandColors } from '@/lib/colors'
import { textStyles } from '@/lib/typography'

function DashboardContent() {
  const { user, logout } = useAuth()

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: brandColors.gray[50],
      padding: '32px 16px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          backgroundColor: brandColors.white,
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <div>
              <h1 style={{
                ...textStyles.h2,
                marginBottom: '8px'
              }}>
                Welcome, {user?.first_name || 'User'}!
              </h1>
              <p style={textStyles.body}>
                You're successfully logged in to Discount Deals
              </p>
            </div>
            
            {/* Profile Avatar */}
            <a
              href="/profile"
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: brandColors.deepRed,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: brandColors.white,
                fontSize: '1.5rem',
                fontWeight: 'bold',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                backgroundImage: user?.avatar_url ? `url(${user.avatar_url})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {!user?.avatar_url && (
                `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase()
              )}
            </a>
          </div>
          
          {/* Quick Actions */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <a
              href="/offers"
              style={{
                padding: '20px',
                backgroundColor: brandColors.gray[50],
                borderRadius: '8px',
                textDecoration: 'none',
                color: brandColors.gray[700],
                transition: 'all 0.2s ease',
                border: `1px solid ${brandColors.gray[200]}`
              }}
            >
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '8px',
                color: brandColors.deepRed
              }}>
                Browse Offers
              </h3>
              <p style={{ fontSize: '14px', color: brandColors.gray[600] }}>
                Discover amazing deals from local businesses
              </p>
            </a>
            
            <a
              href="/profile"
              style={{
                padding: '20px',
                backgroundColor: brandColors.gray[50],
                borderRadius: '8px',
                textDecoration: 'none',
                color: brandColors.gray[700],
                transition: 'all 0.2s ease',
                border: `1px solid ${brandColors.gray[200]}`
              }}
            >
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '8px',
                color: brandColors.deepRed
              }}>
                My Profile
              </h3>
              <p style={{ fontSize: '14px', color: brandColors.gray[600] }}>
                Manage your account settings
              </p>
            </a>
            
            <a
              href="/saved-offers"
              style={{
                padding: '20px',
                backgroundColor: brandColors.gray[50],
                borderRadius: '8px',
                textDecoration: 'none',
                color: brandColors.gray[700],
                transition: 'all 0.2s ease',
                border: `1px solid ${brandColors.gray[200]}`
              }}
            >
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '8px',
                color: brandColors.deepRed
              }}>
                Saved Offers
              </h3>
              <p style={{ fontSize: '14px', color: brandColors.gray[600] }}>
                View your favorite deals
              </p>
            </a>
          </div>
          
          <button
            onClick={logout}
            style={{
              padding: '12px 24px',
              backgroundColor: brandColors.deepRed,
              color: brandColors.white,
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}