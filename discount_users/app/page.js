// app/page.js
import { brandColors } from '@/lib/colors'

export default function Home() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: brandColors.gray[50],
      padding: '32px 16px'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          fontSize: '3rem', 
          fontWeight: 'bold',
          background: `linear-gradient(135deg, ${brandColors.deepRed} 0%, ${brandColors.orange} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '24px'
        }}>
          Discount Deals
        </h1>
        
        <p style={{ 
          fontSize: '1.25rem',
          color: brandColors.gray[600],
          marginBottom: '48px'
        }}>
          Your design system is working perfectly!
        </p>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '24px',
          marginBottom: '48px'
        }}>
          <div style={{ 
            padding: '24px',
            backgroundColor: brandColors.deepRed,
            color: brandColors.white,
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>
              Deep Red
            </h3>
            <p style={{ fontSize: '0.875rem', opacity: '0.9' }}>
              #8E0D3C
            </p>
          </div>
          
          <div style={{ 
            padding: '24px',
            backgroundColor: brandColors.blackcurrant,
            color: brandColors.white,
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>
              Blackcurrant
            </h3>
            <p style={{ fontSize: '0.875rem', opacity: '0.9' }}>
              #1D1842
            </p>
          </div>
          
          <div style={{ 
            padding: '24px',
            backgroundColor: brandColors.orange,
            color: brandColors.white,
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>
              Orange
            </h3>
            <p style={{ fontSize: '0.875rem', opacity: '0.9' }}>
              #EF3B33
            </p>
          </div>
          
          <div style={{ 
            padding: '24px',
            backgroundColor: brandColors.rosePink,
            color: brandColors.blackcurrant,
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>
              Rose Pink
            </h3>
            <p style={{ fontSize: '0.875rem', opacity: '0.9' }}>
              #FDA1A2
            </p>
          </div>
        </div>
        
        <div style={{ 
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button style={{
            padding: '12px 24px',
            backgroundColor: brandColors.deepRed,
            color: brandColors.white,
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}>
            Primary Button
          </button>
          
          <button style={{
            padding: '12px 24px',
            backgroundColor: brandColors.orange,
            color: brandColors.white,
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}>
            Accent Button
          </button>
          
          <button style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            color: brandColors.deepRed,
            border: `2px solid ${brandColors.deepRed}`,
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}>
            Outline Button
          </button>
        </div>
      </div>
    </div>
  )
}