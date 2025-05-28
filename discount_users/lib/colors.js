// lib/colors.js
export const colors = {
  // Brand colors
  deepRed: '#8E0D3C',
  blackcurrant: '#1D1842',
  orange: '#EF3B33',
  rosePink: '#FDA1A2',
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
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
  }
}

// Color utilities
export const getGradient = (from, to, direction = 'to right') => ({
  background: `linear-gradient(${direction}, ${from}, ${to})`
})

export const getBrandGradient = (direction = 'to right') => 
  getGradient(colors.deepRed, colors.orange, direction)