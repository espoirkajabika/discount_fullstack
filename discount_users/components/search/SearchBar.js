// components/search/SearchBar.js - Updated to match wireframe
'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { brandColors } from '@/lib/colors'

export default function SearchBar({ placeholder = "Search for deals, products, or businesses...", className = '' }) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const router = useRouter()
  const searchRef = useRef(null)

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false)
        setIsFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setShowSuggestions(false)
      setIsFocused(false)
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
    setShowSuggestions(true)
  }

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion)
    router.push(`/search?q=${encodeURIComponent(suggestion)}`)
    setShowSuggestions(false)
    setIsFocused(false)
  }

  // Popular search suggestions
  const popularSearches = [
    { text: "Food & Dining", icon: "🍽️" },
    { text: "Beauty & Spa", icon: "💅" },
    { text: "Electronics", icon: "📱" },
    { text: "Fitness & Gym", icon: "💪" },
    { text: "Coffee Shops", icon: "☕" },
    { text: "Shopping Deals", icon: "🛍️" }
  ]

  return (
    <div ref={searchRef} style={{ position: 'relative', width: '100%' }}>
      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: brandColors.white,
          borderRadius: '28px',
          padding: '4px 8px',
          boxShadow: isFocused 
            ? `0 0 0 3px ${brandColors.deepRed}20, 0 4px 12px rgba(0, 0, 0, 0.15)` 
            : '0 4px 12px rgba(0, 0, 0, 0.1)',
          border: `2px solid ${isFocused ? brandColors.deepRed : brandColors.gray[200]}`,
          transition: 'all 0.3s ease',
          maxWidth: '100%'
        }}>
          {/* Search Icon */}
          <div style={{
            padding: '12px 16px',
            color: brandColors.gray[400],
            fontSize: '18px'
          }}>
            🔍
          </div>
          
          {/* Input Field */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleFocus}
            placeholder={placeholder}
            style={{
              flex: 1,
              padding: '16px 8px',
              border: 'none',
              borderRadius: '25px',
              fontSize: '16px',
              outline: 'none',
              backgroundColor: 'transparent',
              color: brandColors.gray[700]
            }}
          />
          
          {/* Clear Button */}
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{
                padding: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                color: brandColors.gray[400],
                cursor: 'pointer',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = brandColors.gray[100]
                e.target.style.color = brandColors.gray[600]
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent'
                e.target.style.color = brandColors.gray[400]
              }}
            >
              ✕
            </button>
          )}
          
          {/* Search Button */}
          <button
            type="submit"
            style={{
              padding: '12px 20px',
              backgroundColor: brandColors.deepRed,
              color: brandColors.white,
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              minWidth: '100px',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = brandColors.orange
              e.target.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = brandColors.deepRed
              e.target.style.transform = 'translateY(0)'
            }}
          >
            Search
          </button>
        </div>
      </form>
      
      {/* Quick Search Suggestions */}
      {showSuggestions && isFocused && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: brandColors.white,
          borderRadius: '12px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
          border: `1px solid ${brandColors.gray[200]}`,
          marginTop: '8px',
          zIndex: 1000,
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${brandColors.gray[100]}`,
            fontSize: '12px',
            fontWeight: '600',
            color: brandColors.gray[500],
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Popular Searches
          </div>
          
          {/* Popular Search Items */}
          {popularSearches.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(item.text)}
              style={{
                width: '100%',
                padding: '12px 20px',
                border: 'none',
                backgroundColor: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                color: brandColors.gray[700],
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = brandColors.gray[50]
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent'
              }}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {item.text}
            </button>
          ))}
          
          {/* Quick Action */}
          <div style={{
            padding: '12px 20px',
            borderTop: `1px solid ${brandColors.gray[100]}`,
            backgroundColor: brandColors.gray[25]
          }}>
            <button
              type="button"
              onClick={() => router.push('/categories')}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: brandColors.rosePink,
                color: brandColors.deepRed,
                border: 'none',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Browse All Categories →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}