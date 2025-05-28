// components/layout/Navbar.js
'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { brandColors } from '@/lib/colors'
import { textStyles } from '@/lib/typography'

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // Handle responsive design
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu)
  }

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
            Discount Deals
          </h1>
        </a>
        
        {/* Navigation Links - Desktop */}
        {!isMobile && (
          <nav style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '32px'
          }}>
            <a 
              href="/browse" 
              style={{ 
                ...textStyles.link, 
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              Browse
            </a>
            <a 
              href="/categories" 
              style={{ 
                ...textStyles.link, 
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              Categories
            </a>
            {isAuthenticated && (
              <a 
                href="/saved" 
                style={{ 
                  ...textStyles.link, 
                  textDecoration: 'none',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
              >
                Saved
              </a>
            )}
          </nav>
        )}

        {/* Mobile Menu Button */}
        {isMobile && (
          <button
            onClick={toggleMobileMenu}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              color: brandColors.deepRed,
              fontSize: '24px',
              cursor: 'pointer'
            }}
          >
            ☰
          </button>
        )}

        {/* User Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* User Menu Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    backgroundColor: brandColors.deepRed,
                    color: brandColors.white,
                    border: 'none',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => {
                    // Toggle dropdown - implement dropdown logic
                    window.location.href = '/profile'
                  }}
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: brandColors.white,
                    color: brandColors.deepRed,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundImage: user?.avatar_url ? `url(${user.avatar_url})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}>
                    {!user?.avatar_url && (
                      `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase()
                    )}
                  </div>
                  {!isMobile && user?.first_name}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '12px' }}>
              <a
                href="/login"
                style={{
                  padding: isMobile ? '8px 12px' : '10px 20px',
                  backgroundColor: 'transparent',
                  color: brandColors.deepRed,
                  border: `2px solid ${brandColors.deepRed}`,
                  borderRadius: '20px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
              >
                Login
              </a>
              <a
                href="/register"
                style={{
                  padding: isMobile ? '8px 12px' : '10px 20px',
                  backgroundColor: brandColors.deepRed,
                  color: brandColors.white,
                  border: '2px solid transparent',
                  borderRadius: '20px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
              >
                Sign Up
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobile && showMobileMenu && (
        <div style={{
          backgroundColor: brandColors.white,
          borderTop: `1px solid ${brandColors.gray[200]}`,
          padding: '16px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <nav style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <a 
              href="/browse" 
              style={{ 
                ...textStyles.link, 
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '500',
                padding: '8px 0'
              }}
              onClick={() => setShowMobileMenu(false)}
            >
              Browse
            </a>
            <a 
              href="/categories" 
              style={{ 
                ...textStyles.link, 
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '500',
                padding: '8px 0'
              }}
              onClick={() => setShowMobileMenu(false)}
            >
              Categories
            </a>
            {isAuthenticated && (
              <a 
                href="/saved" 
                style={{ 
                  ...textStyles.link, 
                  textDecoration: 'none',
                  fontSize: '16px',
                  fontWeight: '500',
                  padding: '8px 0'
                }}
                onClick={() => setShowMobileMenu(false)}
              >
                Saved
              </a>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}