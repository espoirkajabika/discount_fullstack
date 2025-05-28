// lib/layout.js
import { brandColors, gradients } from './colors'

export const spacing = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
  32: '128px',
}

export const breakpoints = {
  sm: '640px',
  md: '768px', 
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}

export const containerStyles = {
  base: {
    width: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: spacing[4],
    paddingRight: spacing[4],
  },
  
  sizes: {
    sm: { maxWidth: '640px' },
    md: { maxWidth: '768px' },
    lg: { maxWidth: '1024px' },
    xl: { maxWidth: '1280px' },
    '2xl': { maxWidth: '1536px' },
    full: { maxWidth: 'none' },
  }
}

export const gridStyles = {
  base: {
    display: 'grid',
    gap: spacing[6],
  },
  
  responsive: {
    1: { gridTemplateColumns: '1fr' },
    2: { gridTemplateColumns: 'repeat(2, 1fr)' },
    3: { gridTemplateColumns: 'repeat(3, 1fr)' },
    4: { gridTemplateColumns: 'repeat(4, 1fr)' },
    auto: { gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' },
  }
}

export const flexStyles = {
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  between: {
    display: 'flex', 
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  start: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  
  end: {
    display: 'flex',
    justifyContent: 'flex-end', 
    alignItems: 'center',
  },
  
  column: {
    display: 'flex',
    flexDirection: 'column',
  },
  
  wrap: {
    display: 'flex',
    flexWrap: 'wrap',
  }
}

export const sectionStyles = {
  base: {
    paddingTop: spacing[16],
    paddingBottom: spacing[16],
  },
  
  variants: {
    hero: {
      paddingTop: spacing[20],
      paddingBottom: spacing[20],
      background: gradients.subtle,
    },
    feature: {
      paddingTop: spacing[16],
      paddingBottom: spacing[16],
      backgroundColor: brandColors.white,
    },
    cta: {
      paddingTop: spacing[16],
      paddingBottom: spacing[16],
      background: gradients.brand,
      color: brandColors.white,
    }
  }
}