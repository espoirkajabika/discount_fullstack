// lib/componentStyles.js
import { brandColors, shadows, gradients } from './colors'

export const buttonStyles = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    transition: 'all 0.2s ease-in-out',
    outline: 'none',
    userSelect: 'none',
  },
  
  // Sizes
  sizes: {
    sm: {
      padding: '8px 16px',
      fontSize: '14px',
      height: '36px',
    },
    md: {
      padding: '12px 24px', 
      fontSize: '16px',
      height: '44px',
    },
    lg: {
      padding: '16px 32px',
      fontSize: '18px',
      height: '52px',
    },
  },
  
  // Variants
  variants: {
    primary: {
      backgroundColor: brandColors.deepRed,
      color: brandColors.white,
      boxShadow: shadows.brand,
    },
    secondary: {
      backgroundColor: brandColors.blackcurrant,
      color: brandColors.white,
      boxShadow: shadows.md,
    },
    accent: {
      backgroundColor: brandColors.orange,
      color: brandColors.white,
      boxShadow: shadows.orange,
    },
    outline: {
      backgroundColor: 'transparent',
      color: brandColors.deepRed,
      border: `2px solid ${brandColors.deepRed}`,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: brandColors.deepRed,
      border: 'none',
    },
    gradient: {
      background: gradients.brand,
      color: brandColors.white,
      boxShadow: shadows.lg,
    },
    success: {
      backgroundColor: brandColors.success,
      color: brandColors.white,
    },
    danger: {
      backgroundColor: brandColors.error,
      color: brandColors.white,
    },
  },
  
  // States
  hover: {
    primary: { transform: 'translateY(-2px)', boxShadow: shadows.xl },
    secondary: { transform: 'translateY(-2px)', boxShadow: shadows.xl },
    accent: { transform: 'translateY(-2px)', boxShadow: shadows.xl },
    outline: { backgroundColor: brandColors.deepRed, color: brandColors.white },
    ghost: { backgroundColor: brandColors.rosePink, color: brandColors.deepRed },
    gradient: { transform: 'translateY(-2px)', boxShadow: shadows.xl },
  },
  
  disabled: {
    opacity: '0.5',
    cursor: 'not-allowed',
    transform: 'none',
  }
}

export const cardStyles = {
  base: {
    backgroundColor: brandColors.white,
    borderRadius: '12px',
    boxShadow: shadows.md,
    transition: 'all 0.3s ease-in-out',
    overflow: 'hidden',
  },
  
  variants: {
    default: {
      padding: '24px',
    },
    compact: {
      padding: '16px',
    },
    featured: {
      padding: '32px',
      border: `2px solid ${brandColors.deepRed}`,
      background: gradients.subtle,
    },
    product: {
      padding: '0',
      cursor: 'pointer',
    },
    offer: {
      padding: '20px',
      background: `linear-gradient(135deg, ${brandColors.white} 0%, ${brandColors.rosePink}10 100%)`,
    }
  },
  
  hover: {
    default: {
      transform: 'translateY(-4px)',
      boxShadow: shadows.xl,
    },
    product: {
      transform: 'translateY(-6px)',
      boxShadow: shadows.xl,
    },
  }
}

export const badgeStyles = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  
  variants: {
    primary: {
      backgroundColor: brandColors.deepRed,
      color: brandColors.white,
    },
    secondary: {
      backgroundColor: brandColors.gray[100],
      color: brandColors.gray[800],
    },
    success: {
      backgroundColor: brandColors.success,
      color: brandColors.white,
    },
    warning: {
      backgroundColor: brandColors.warning,
      color: brandColors.white,
    },
    error: {
      backgroundColor: brandColors.error,
      color: brandColors.white,
    },
    discount: {
      backgroundColor: brandColors.orange,
      color: brandColors.white,
    },
    new: {
      background: gradients.brand,
      color: brandColors.white,
    },
    verified: {
      backgroundColor: brandColors.success,
      color: brandColors.white,
    }
  }
}

export const inputStyles = {
  base: {
    width: '100%',
    padding: '12px 16px',
    border: `1px solid ${brandColors.gray[300]}`,
    borderRadius: '8px',
    fontSize: '16px',
    transition: 'all 0.2s ease-in-out',
    outline: 'none',
    backgroundColor: brandColors.white,
  },
  
  focus: {
    borderColor: brandColors.deepRed,
    boxShadow: `0 0 0 3px ${brandColors.deepRed}20`,
  },
  
  error: {
    borderColor: brandColors.error,
    boxShadow: `0 0 0 3px ${brandColors.error}20`,
  },
  
  success: {
    borderColor: brandColors.success,
    boxShadow: `0 0 0 3px ${brandColors.success}20`,
  }
}