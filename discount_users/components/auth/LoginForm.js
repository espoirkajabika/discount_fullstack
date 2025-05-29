// components/auth/LoginForm.js
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { brandColors } from '@/lib/colors'
import { textStyles } from '@/lib/typography'
import Spinner from '@/components/ui/spinner'

export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState({})
  const { login, loading, error, clearError } = useAuth()
  const router = useRouter()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
    
    // Clear general error
    if (error) {
      clearError()
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    const result = await login(formData.email, formData.password)
    
    if (result.success) {
      router.push('/')
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: `1px solid ${brandColors.gray[300]}`,
    borderRadius: '8px',
    fontSize: '16px',
    transition: 'all 0.2s ease',
    outline: 'none',
    backgroundColor: brandColors.white,
  }

  const inputFocusStyle = {
    borderColor: brandColors.deepRed,
    boxShadow: `0 0 0 3px ${brandColors.deepRed}20`,
  }

  const inputErrorStyle = {
    borderColor: brandColors.error,
    boxShadow: `0 0 0 3px ${brandColors.error}20`,
  }

  return (
    <div style={{
      maxWidth: '400px',
      margin: '0 auto',
      padding: '32px',
      backgroundColor: brandColors.white,
      borderRadius: '12px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{
          ...textStyles.h2,
          background: `linear-gradient(135deg, ${brandColors.deepRed} 0%, ${brandColors.orange} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '8px'
        }}>
          Welcome Back
        </h1>
        <p style={textStyles.body}>
          Sign in to your account to continue
        </p>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: `${brandColors.error}10`,
          color: brandColors.error,
          borderRadius: '8px',
          marginBottom: '24px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: brandColors.gray[700]
          }}>
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            style={{
              ...inputStyle,
              ...(errors.email ? inputErrorStyle : {})
            }}
            onFocus={(e) => {
              if (!errors.email) {
                Object.assign(e.target.style, inputFocusStyle)
              }
            }}
            onBlur={(e) => {
              Object.assign(e.target.style, inputStyle)
              if (errors.email) {
                Object.assign(e.target.style, inputErrorStyle)
              }
            }}
            placeholder="Enter your email"
          />
          {errors.email && (
            <p style={{
              color: brandColors.error,
              fontSize: '12px',
              marginTop: '4px'
            }}>
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: brandColors.gray[700]
          }}>
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            style={{
              ...inputStyle,
              ...(errors.password ? inputErrorStyle : {})
            }}
            onFocus={(e) => {
              if (!errors.password) {
                Object.assign(e.target.style, inputFocusStyle)
              }
            }}
            onBlur={(e) => {
              Object.assign(e.target.style, inputStyle)
              if (errors.password) {
                Object.assign(e.target.style, inputErrorStyle)
              }
            }}
            placeholder="Enter your password"
          />
          {errors.password && (
            <p style={{
              color: brandColors.error,
              fontSize: '12px',
              marginTop: '4px'
            }}>
              {errors.password}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: loading ? brandColors.gray[400] : brandColors.deepRed,
            color: brandColors.white,
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {loading && <Spinner />}
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div style={{
        textAlign: 'center',
        marginTop: '24px',
        paddingTop: '24px',
        borderTop: `1px solid ${brandColors.gray[200]}`
      }}>
        <p style={{ ...textStyles.body, marginBottom: '16px' }}>
          Don't have an account?{' '}
          <a
            href="/register"
            style={{
              color: brandColors.deepRed,
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            Sign up here
          </a>
        </p>
      </div>
    </div>
  )
}