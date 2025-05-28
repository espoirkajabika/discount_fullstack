// components/ui/Card.js  
"use client"
import { useState } from 'react'
import { cardStyles } from '@/lib/componentStyles'

export default function Card({
  children,
  variant = 'default',
  hoverable = true,
  onClick,
  className = '',
  ...props
}) {
  const [isHovered, setIsHovered] = useState(false)
  
  const baseStyle = cardStyles.base
  const variantStyle = cardStyles.variants[variant]
  const hoverStyle = hoverable && isHovered ? cardStyles.hover[variant] || cardStyles.hover.default : {}
  
  return (
    <div
      style={{
        ...baseStyle,
        ...variantStyle,
        ...hoverStyle,
        cursor: onClick ? 'pointer' : 'default',
      }}
      onMouseEnter={() => hoverable && setIsHovered(true)}
      onMouseLeave={() => hoverable && setIsHovered(false)}
      onClick={onClick}
      className={className}
      {...props}
    >
      {children}
    </div>
  )
}