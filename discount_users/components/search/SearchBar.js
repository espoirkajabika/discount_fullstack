// components/search/SearchBar.js
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { brandColors } from '@/lib/colors'

export default function SearchBar({ placeholder = "Search...", className = '' }) {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '500px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: brandColors.white,
        borderRadius: '25px',
        padding: '4px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: `2px solid ${brandColors.gray[200]}`
      }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1,
            padding: '12px 20px',
            border: 'none',
            borderRadius: '25px',
            fontSize: '16px',
            outline: 'none',
            backgroundColor: 'transparent'
          }}
        />
        <button
          type="submit"
          style={{
            padding: '12px 20px',
            backgroundColor: brandColors.deepRed,
            color: brandColors.white,
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            minWidth: '80px'
          }}
        >
          Search
        </button>
      </div>
    </form>
  )
}