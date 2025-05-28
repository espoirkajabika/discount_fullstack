// lib/typography.js
import { brandColors } from './colors'

export const fontSizes = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem',    // 48px
  '6xl': '3.75rem', // 60px
}

export const fontWeights = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
}

export const lineHeights = {
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
}

export const textStyles = {
  // Headings
  h1: {
    fontSize: fontSizes['5xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    color: brandColors.blackcurrant,
  },
  h2: {
    fontSize: fontSizes['4xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    color: brandColors.blackcurrant,
  },
  h3: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.snug,
    color: brandColors.blackcurrant,
  },
  h4: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.snug,
    color: brandColors.gray[800],
  },
  h5: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
    color: brandColors.gray[800],
  },
  
  // Body text
  bodyLarge: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.relaxed,
    color: brandColors.gray[700],
  },
  body: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    color: brandColors.gray[600],
  },
  bodySmall: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    color: brandColors.gray[500],
  },
  
  // Special text
  accent: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    color: brandColors.deepRed,
  },
  gradient: {
    fontSize: fontSizes['4xl'],
    fontWeight: fontWeights.bold,
    background: `linear-gradient(135deg, ${brandColors.deepRed} 0%, ${brandColors.orange} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  
  // Interactive text
  link: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    color: brandColors.deepRed,
    textDecoration: 'none',
    cursor: 'pointer',
  },
  
  // Status text
  success: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: brandColors.success,
  },
  error: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: brandColors.error,
  },
}