// lib/styles.js
import { colors } from './colors'

export const buttonStyles = {
  base: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '16px',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  
  primary: {
    backgroundColor: colors.deepRed,
    color: colors.white,
  },
  
  secondary: {
    backgroundColor: colors.blackcurrant,
    color: colors.white,
  },
  
  accent: {
    backgroundColor: colors.orange,
    color: colors.white,
  },
  
  outline: {
    backgroundColor: 'transparent',
    color: colors.deepRed,
    border: `2px solid ${colors.deepRed}`,
  },
  
  ghost: {
    backgroundColor: 'transparent',
    color: colors.deepRed,
    border: 'none',
  },
  
  gradient: {
    background: `linear-gradient(to right, ${colors.deepRed}, ${colors.orange})`,
    color: colors.white,
    border: 'none',
  }
}

export const cardStyles = {
  base: {
    backgroundColor: colors.white,
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease',
  },
  
  hover: {
    transform: 'translateY(-4px)',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  
  featured: {
    border: `2px solid ${colors.deepRed}`,
    backgroundColor: colors.white,
  }
}

export const textStyles = {
  heading: {
    fontWeight: '700',
    color: colors.blackcurrant,
  },
  
  subheading: {
    fontWeight: '600',
    color: colors.gray[700],
  },
  
  body: {
    color: colors.gray[600],
    lineHeight: '1.6',
  },
  
  accent: {
    color: colors.deepRed,
    fontWeight: '600',
  },
  
  gradient: {
    background: `linear-gradient(to right, ${colors.deepRed}, ${colors.orange})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    fontWeight: '700',
  }
}

export const layoutStyles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 16px',
  },
  
  section: {
    padding: '64px 0',
  },
  
  grid: {
    display: 'grid',
    gap: '24px',
  },
  
  flexCenter: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  flexBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }
}