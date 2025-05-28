// lib/colors.js
export const brandColors = {
  // Primary brand colors
  deepRed: '#8E0D3C',
  blackcurrant: '#1D1842', 
  orange: '#EF3B33',
  rosePink: '#FDA1A2',
  
  // Semantic colors
  white: '#FFFFFF',
  black: '#000000',
  
  // Gray scale
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB', 
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B', 
  error: '#EF4444',
  info: '#3B82F6',
}

// Gradient utilities
export const gradients = {
  brand: `linear-gradient(135deg, ${brandColors.deepRed} 0%, ${brandColors.orange} 100%)`,
  brandHorizontal: `linear-gradient(90deg, ${brandColors.deepRed} 0%, ${brandColors.orange} 100%)`,
  brandVertical: `linear-gradient(180deg, ${brandColors.deepRed} 0%, ${brandColors.orange} 100%)`,
  subtle: `linear-gradient(135deg, ${brandColors.rosePink} 0%, ${brandColors.white} 100%)`,
  dark: `linear-gradient(135deg, ${brandColors.blackcurrant} 0%, ${brandColors.deepRed} 100%)`,
}

// Shadow utilities
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  brand: `0 10px 25px -5px rgba(142, 13, 60, 0.2)`,
  orange: `0 10px 25px -5px rgba(239, 59, 51, 0.2)`,
}