// context/AuthContext.js
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check for existing auth on mount
  useEffect(() => {
    checkExistingAuth()
  }, [])

  const checkExistingAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const userData = localStorage.getItem('auth_user')

      if (token && userData) {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        
        // Verify token is still valid
        await verifyToken(token)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      clearAuthData()
    } finally {
      setLoading(false)
    }
  }

  const verifyToken = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Token verification failed')
      }

      const userData = await response.json()
      setUser(userData.user || userData)
    } catch (error) {
      console.error('Token verification failed:', error)
      clearAuthData()
    }
  }

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle different error formats more gracefully
        let errorMessage = 'Login failed'
        
        if (data.detail) {
          if (typeof data.detail === 'string') {
            errorMessage = data.detail
          } else if (Array.isArray(data.detail)) {
            errorMessage = data.detail.map(err => err.msg || err).join(', ')
          }
        } else if (data.message) {
          errorMessage = data.message
        }
        
        return { error: errorMessage }
      }

      // Store auth data
      localStorage.setItem('auth_token', data.access_token)
      localStorage.setItem('auth_user', JSON.stringify(data.user))
      
      setUser(data.user)
      
      return { success: true, user: data.user }
    } catch (error) {
      console.error('Login error:', error)
      return { error: error.message || 'Network error. Please try again.' }
    }
  }

  const register = async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle different error formats more gracefully
        let errorMessage = 'Registration failed'
        
        if (data.detail) {
          if (typeof data.detail === 'string') {
            errorMessage = data.detail
          } else if (Array.isArray(data.detail)) {
            errorMessage = data.detail.map(err => {
              const field = err.loc ? err.loc[err.loc.length - 1] : 'field'
              return `${field}: ${err.msg}`
            }).join(', ')
          }
        } else if (data.message) {
          errorMessage = data.message
        }
        
        return { error: errorMessage }
      }

      // Store auth data
      localStorage.setItem('auth_token', data.access_token)
      localStorage.setItem('auth_user', JSON.stringify(data.user))
      
      setUser(data.user)
      
      return { success: true, user: data.user, token: data.access_token }
    } catch (error) {
      console.error('Registration error:', error)
      return { error: error.message || 'Network error. Please try again.' }
    }
  }

  // Business-specific registration - keep existing interface
  const registerBusiness = async (businessData) => {
    const userData = {
      ...businessData,
      is_business: true
    }
    return await register(userData)
  }

  // Customer-specific registration
  const registerCustomer = async (customerData) => {
    const userData = {
      ...customerData,
      is_business: false
    }
    return await register(userData)
  }

  const logout = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearAuthData()
    }
  }

  const clearAuthData = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setUser(null)
  }

  // Add this login function that your existing signin page expects
  const loginUser = (user, token = null) => {
    if (token) {
      localStorage.setItem('auth_token', token)
    }
    localStorage.setItem('auth_user', JSON.stringify(user))
    setUser(user)
  }

  const value = {
    user,
    loading,
    login: loginUser,  // This is what your existing signin page expects
    signIn: login,     // This is the API login function
    register,
    registerBusiness,
    registerCustomer,
    logout,
    clearAuthData
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}