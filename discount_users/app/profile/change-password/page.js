// app/profile/change-password/page.js
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { brandColors } from '@/lib/colors'
import { textStyles } from '@/lib/typography'
import api from '@/lib/api'

function ChangePasswordContent() {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
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
    
    // Clear message
    if (message.text) {
      setMessage({ type: '', text: '' })
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.current_password) {
      newErrors.current_password = 'Current password is required'
    }
    
    if (!formData.new_password) {
      newErrors.new_password = 'New password is required'
    } else if (formData.new_password.length < 6) {
      newErrors.new_password = 'New password must be at least 6 characters'
    }
    
    if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match'
    }
    
    if (formData.current_password === formData.new_password) {
      newErrors.new_password = 'New password must be different from current password'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      await api.put('/auth/change-password', {
        current_password: formData.current_password,
        new_password: formData.new_password
      })
      
      setMessage({ 
        type: 'success', 
        text: 'Password changed successfully! Redirecting...' 
      })
      
      // Reset form
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      })
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/profile')
      }, 2000)
      
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to change password' 
      })
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: `1px solid ${brandColors.gray[300]}`,
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    backgroundColor: brandColors.white,
    transition: 'all 0.2s ease',
  }

  const inputErrorStyle = {
    borderColor: brandColors.error,
    boxShadow: `0 0 0 3px ${brandColors.error}20`,
  }

  const renderField = (name, label, placeholder = '') => (
    <div>
      <label style={{
        display: 'block',
        marginBottom: '8px',
        fontSize: '14px',
        fontWeight: '600',
        color: brandColors.gray[700]
      }}>
        {label}
      </label>
      <input
        type="password"
        name={name}
        value={formData[name]}
        onChange={handleChange}
        style={{
          ...inputStyle,
          ...(errors[name] ? inputErrorStyle : {})
        }}
        placeholder={placeholder}
      />
      {errors[name] && (
        <p style={{
          color: brandColors.error,
          fontSize: '12px',
          marginTop: '4px'
        }}>
          {errors[name]}
        </p>
      )}
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: brandColors.gray[50],
      padding: '32px 16px'
    }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div style={{
          backgroundColor: brandColors.white,
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{
              ...textStyles.h2,
              marginBottom: '8px'
            }}>
              Change Password
            </h1>
            <p style={textStyles.body}>
              Update your account password for better security
            </p>
          </div>

          {/* Message */}
          {message.text && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '24px',
              backgroundColor: message.type === 'success' 
                ? `${brandColors.success}10` 
                : `${brandColors.error}10`,
              color: message.type === 'success' 
                ? brandColors.success 
                : brandColors.error,
              fontSize: '14px'
            }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {renderField('current_password', 'Current Password', 'Enter your current password')}
            {renderField('new_password', 'New Password', 'Enter your new password')}
            {renderField('confirm_password', 'Confirm New Password', 'Confirm your new password')}

            <div style={{
              display: 'flex',
              gap: '16px',
              marginTop: '24px'
            }}>
              <button
                type="button"
                onClick={() => router.push('/profile')}
                style={{
                  flex: 1,
                  padding: '14px',
                  backgroundColor: brandColors.gray[300],
                  color: brandColors.gray[700],
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
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
                {loading && (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid transparent',
                    borderTop: '2px solid currentColor',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                )}
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function ChangePasswordPage() {
  return (
    <ProtectedRoute>
      <ChangePasswordContent />
    </ProtectedRoute>
  )
}