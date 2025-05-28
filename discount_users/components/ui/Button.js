// components/ui/Button.js
"use client"
import { useState } from 'react'
import { buttonStyles } from '@/lib/componentStyles'

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  ...props
}) {
  const [isHovered, setIsHovered] = useState(false)
  
  const baseStyle = buttonStyles.base
  const sizeStyle = buttonStyles.sizes[size]
  const variantStyle = buttonStyles.variants[variant]
  const hoverStyle = isHovered && !disabled ? buttonStyles.hover[variant] : {}
  const disabledStyle = disabled ? buttonStyles.disabled : {}
  
  const handleClick = (e) => {
    if (!disabled && !loading && onClick) {
      onClick(e)
    }
  }
  
  return (
    <button
      style={{
        ...baseStyle,
        ...sizeStyle,
        ...variantStyle,
        ...hoverStyle,
        ...disabledStyle,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      disabled={disabled || loading}
      className={className}
      {...props}
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
      {children}
    </button>
  )
}