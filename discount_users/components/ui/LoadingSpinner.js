// components/ui/LoadingSpinner.js
import { brandColors } from '@/lib/colors'

export default function LoadingSpinner({ size = '24px', color = brandColors.deepRed }) {
  return (
    <div 
      style={{
        width: size,
        height: size,
        border: `3px solid ${brandColors.gray[200]}`,
        borderTop: `3px solid ${color}`,
        borderRadius: '50%'
      }}
      className="spin"
    />
  )
}