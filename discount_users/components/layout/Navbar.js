// components/layout/Navbar.js
'use client'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { brandColors } from '@/lib/colors'
import { textStyles } from '@/lib/typography'

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown)
  }

  const handleLogout = async () => {
    await logout()
    setShowDropdown(false)
    window.location.href = '/'
  }

  const dropdownItems = isAuthenticated ? [
    { label: 'Profile', href: '/profile', icon: '👤' },
    { label: 'Account Settings', href: '/profile/settings', icon: '⚙️' },
    { label: 'Saved Offers', href: '/saved-offers', icon: '❤️' },
    { label: 'Claimed Offers', href: '/claimed-offers', icon: '🎫' },
    { label: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { label: 'Logout', action: handleLogout, icon: '🚪' }
  ] : [
    { label: 'Login', href: '/login', icon: '🔑' },
    { label: 'Sign Up', href: '/register', icon: '✨' }
  ]

  return (
    <header style={{
      backgroundColor: brandColors.white,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      borderBottom: `1px solid ${brandColors.gray[200]}`
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Logo */}
        <a
          href="/"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <h1 style={{
            ...textStyles.h3,
            background: `linear-gradient(135deg, ${brandColors.deepRed} 0%, ${brandColors.orange} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: 0,
            fontSize: '24px',
            fontWeight: '700'
          }}>
            Discount
          </h1>
        </a>

        {/* Avatar with Dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={toggleDropdown}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: isAuthenticated ? brandColors.deepRed : brandColors.gray[400],
              color: brandColors.white,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'all 0.2s ease',
              backgroundImage: user?.avatar_url ? `url(${user.avatar_url})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              boxShadow: showDropdown ? `0 0 0 3px ${brandColors.deepRed}30` : '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              if (!showDropdown) {
                e.target.style.transform = 'scale(1.05)'
              }
            }}
            onMouseLeave={(e) => {
              if (!showDropdown) {
                e.target.style.transform = 'scale(1)'
              }
            }}
          >
            {isAuthenticated && !user?.avatar_url ? (
              `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || 'U'}`.toUpperCase()
            ) : !isAuthenticated ? (
              '👤'
            ) : null}
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              backgroundColor: brandColors.white,
              borderRadius: '12px',
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
              border: `1px solid ${brandColors.gray[200]}`,
              minWidth: '200px',
              overflow: 'hidden',
              zIndex: 1000,
              animation: 'fadeIn 0.2s ease'
            }}>
              {/* User Info Header (if authenticated) */}
              {isAuthenticated && (
                <div style={{
                  padding: '16px 20px',
                  borderBottom: `1px solid ${brandColors.gray[100]}`,
                  backgroundColor: brandColors.gray[25]
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: brandColors.gray[800],
                    marginBottom: '4px'
                  }}>
                    {user?.first_name && user?.last_name 
                      ? `${user.first_name} ${user.last_name}`
                      : 'User'
                    }
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: brandColors.gray[600]
                  }}>
                    {user?.email}
                  </div>
                </div>
              )}

              {/* Menu Items */}
              {dropdownItems.map((item, index) => (
                <div key={index}>
                  {item.href ? (
                    <a
                      href={item.href}
                      onClick={() => setShowDropdown(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 20px',
                        textDecoration: 'none',
                        color: brandColors.gray[700],
                        fontSize: '14px',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = brandColors.gray[50]
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent'
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>{item.icon}</span>
                      {item.label}
                    </a>
                  ) : (
                    <button
                      onClick={item.action}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 20px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: item.label === 'Logout' ? brandColors.error : brandColors.gray[700],
                        fontSize: '14px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = item.label === 'Logout' 
                          ? `${brandColors.error}10` 
                          : brandColors.gray[50]
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent'
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>{item.icon}</span>
                      {item.label}
                    </button>
                  )}
                </div>
              ))}

              {/* Guest Welcome Message */}
              {!isAuthenticated && (
                <div style={{
                  padding: '12px 20px',
                  borderTop: `1px solid ${brandColors.gray[100]}`,
                  backgroundColor: brandColors.gray[25],
                  fontSize: '12px',
                  color: brandColors.gray[600],
                  textAlign: 'center'
                }}>
                  Welcome! Sign in to save offers and track your deals.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add CSS for fade-in animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </header>
  )
}