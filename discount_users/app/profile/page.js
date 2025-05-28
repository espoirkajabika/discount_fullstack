// app/profile/page.js
'use client'
import { useState } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import { brandColors } from '@/lib/colors'
import { textStyles } from '@/lib/typography'
import api, { endpoints } from '@/lib/api'

function ProfileContent() {
  const { user, updateUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    avatar_url: user?.avatar_url || '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await api.put('/auth/me', formData)
      updateUser(response.data)
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setIsEditing(false)
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to update profile' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone: user?.phone || '',
      avatar_url: user?.avatar_url || '',
    })
    setIsEditing(false)
    setMessage({ type: '', text: '' })
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: `1px solid ${brandColors.gray[300]}`,
    borderRadius: '8px',
    fontSize: '16px',
    backgroundColor: brandColors.white,
    outline: 'none',
    transition: 'all 0.2s ease',
  }

  const disabledInputStyle = {
    ...inputStyle,
    backgroundColor: brandColors.gray[50],
    color: brandColors.gray[600],
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: brandColors.gray[50],
      padding: '32px 16px'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
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
            <h1 style={textStyles.h2}>My Profile</h1>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: brandColors.deepRed,
                  color: brandColors.white,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Edit Profile
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleCancel}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: brandColors.gray[300],
                    color: brandColors.gray[700],
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: loading ? brandColors.gray[400] : brandColors.deepRed,
                    color: brandColors.white,
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {loading && (
                    <div style={{
                      width: '14px',
                      height: '14px',
                      border: '2px solid transparent',
                      borderTop: '2px solid currentColor',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                  )}
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
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

          {/* Profile Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Avatar */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: brandColors.deepRed,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '2rem',
                color: brandColors.white,
                fontWeight: 'bold',
                backgroundImage: formData.avatar_url ? `url(${formData.avatar_url})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}>
                {!formData.avatar_url && (
                  `${formData.first_name?.[0] || ''}${formData.last_name?.[0] || ''}`.toUpperCase()
                )}
              </div>
              {isEditing && (
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: brandColors.gray[700]
                  }}>
                    Avatar URL (Optional)
                  </label>
                  <input
                    type="url"
                    name="avatar_url"
                    value={formData.avatar_url}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              )}
            </div>

            {/* Email (Read-only) */}
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
                value={user?.email || ''}
                disabled
                style={disabledInputStyle}
              />
              <p style={{
                fontSize: '12px',
                color: brandColors.gray[500],
                marginTop: '4px'
              }}>
                Email cannot be changed
              </p>
            </div>

            {/* First Name */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: brandColors.gray[700]
              }}>
                First Name
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                disabled={!isEditing}
                style={isEditing ? inputStyle : disabledInputStyle}
                placeholder="Enter your first name"
              />
            </div>

            {/* Last Name */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: brandColors.gray[700]
              }}>
                Last Name
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                disabled={!isEditing}
                style={isEditing ? inputStyle : disabledInputStyle}
                placeholder="Enter your last name"
              />
            </div>

            {/* Phone */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: brandColors.gray[700]
              }}>
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                style={isEditing ? inputStyle : disabledInputStyle}
                placeholder="Enter your phone number"
              />
            </div>

            {/* Account Info */}
            <div style={{
              padding: '16px',
              backgroundColor: brandColors.gray[50],
              borderRadius: '8px',
              marginTop: '20px'
            }}>
              <h3 style={{
                ...textStyles.h5,
                marginBottom: '12px'
              }}>
                Account Information
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={textStyles.body}>
                  <strong>Account Type:</strong> {user?.is_business ? 'Business' : 'Customer'}
                </p>
                <p style={textStyles.body}>
                  <strong>Member Since:</strong> {new Date(user?.created_at).toLocaleDateString()}
                </p>
                <p style={textStyles.body}>
                  <strong>Status:</strong> 
                  <span style={{
                    marginLeft: '8px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: user?.is_active ? brandColors.success : brandColors.error,
                    color: brandColors.white
                  }}>
                    {user?.is_active ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* Additional Settings */}
        <div style={{
          backgroundColor: brandColors.white,
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            ...textStyles.h3,
            marginBottom: '24px'
          }}>
            Account Settings
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <a
              href="/profile/change-password"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                border: `1px solid ${brandColors.gray[200]}`,
                borderRadius: '8px',
                textDecoration: 'none',
                color: brandColors.gray[700],
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                  Change Password
                </h4>
                <p style={{ fontSize: '14px', color: brandColors.gray[500] }}>
                  Update your account password
                </p>
              </div>
              <div style={{
                fontSize: '18px',
                color: brandColors.gray[400]
              }}>
                →
              </div>
            </a>

            <a
              href="/profile/notifications"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                border: `1px solid ${brandColors.gray[200]}`,
                borderRadius: '8px',
                textDecoration: 'none',
                color: brandColors.gray[700],
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                  Notification Settings
                </h4>
                <p style={{ fontSize: '14px', color: brandColors.gray[500] }}>
                  Manage your notification preferences
                </p>
              </div>
              <div style={{
                fontSize: '18px',
                color: brandColors.gray[400]
              }}>
                →
              </div>
            </a>

            <a
              href="/dashboard"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                border: `1px solid ${brandColors.gray[200]}`,
                borderRadius: '8px',
                textDecoration: 'none',
                color: brandColors.gray[700],
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                  Back to Dashboard
                </h4>
                <p style={{ fontSize: '14px', color: brandColors.gray[500] }}>
                  Return to your main dashboard
                </p>
              </div>
              <div style={{
                fontSize: '18px',
                color: brandColors.gray[400]
              }}>
                →
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  )
}