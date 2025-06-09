// components/ui/SimpleToast.js - Create this new file
'use client'
import { useState, useEffect, createContext, useContext } from 'react'
import { brandColors } from '@/lib/colors'

// Toast Context
const ToastContext = createContext()

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Toast Provider Component
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random()
    const newToast = { id, message, type, duration }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto remove toast after duration
    setTimeout(() => {
      removeToast(id)
    }, duration)
    
    return id
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  // Helper methods for different toast types
  const toast = (options) => {
    if (typeof options === 'string') {
      return addToast(options, 'info')
    }
    return addToast(options.title || options.description, options.variant || 'info', options.duration)
  }

  toast.success = (message, duration) => addToast(message, 'success', duration)
  toast.error = (message, duration) => addToast(message, 'error', duration)
  toast.warning = (message, duration) => addToast(message, 'warning', duration)
  toast.info = (message, duration) => addToast(message, 'info', duration)

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

// Toast Container Component
function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      maxWidth: '400px'
    }}>
      {toasts.map(toast => (
        <ToastItem 
          key={toast.id} 
          toast={toast} 
          onRemove={() => onRemove(toast.id)} 
        />
      ))}
    </div>
  )
}

// Individual Toast Component
function ToastItem({ toast, onRemove }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 50)
  }, [])

  const handleRemove = () => {
    setIsExiting(true)
    setTimeout(onRemove, 300) // Match animation duration
  }

  const getToastStyle = () => {
    const baseStyle = {
      padding: '16px 20px',
      borderRadius: '8px',
      color: brandColors.white,
      fontSize: '14px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      transform: isVisible && !isExiting ? 'translateX(0)' : 'translateX(100%)',
      opacity: isVisible && !isExiting ? 1 : 0,
      minWidth: '300px'
    }

    const typeStyles = {
      success: { backgroundColor: brandColors.success || '#10B981' },
      error: { backgroundColor: brandColors.error || '#EF4444' },
      warning: { backgroundColor: brandColors.warning || '#F59E0B' },
      info: { backgroundColor: brandColors.deepRed },
      destructive: { backgroundColor: brandColors.error || '#EF4444' } // For shadcn compatibility
    }

    return { ...baseStyle, ...typeStyles[toast.type] }
  }

  const getIcon = () => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      destructive: '❌'
    }
    return icons[toast.type] || icons.info
  }

  return (
    <div style={getToastStyle()} onClick={handleRemove}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px' }}>{getIcon()}</span>
        <span>{toast.message}</span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleRemove()
        }}
        style={{
          background: 'none',
          border: 'none',
          color: brandColors.white,
          fontSize: '18px',
          cursor: 'pointer',
          padding: '0',
          opacity: 0.7,
          minWidth: '20px'
        }}
      >
        ×
      </button>
    </div>
  )
}