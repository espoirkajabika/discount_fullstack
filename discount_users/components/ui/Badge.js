// components/ui/Badge.js
"use client"
import { badgeStyles } from '@/lib/componentStyles'

export default function Badge({
  children,
  variant = 'secondary',
  className = '',
  ...props
}) {
  const baseStyle = badgeStyles.base
  const variantStyle = badgeStyles.variants[variant]
  
  return (
    <span
      style={{
        ...baseStyle,
        ...variantStyle,
      }}
      className={className}
      {...props}
    >
      {children}
    </span>
  )
}