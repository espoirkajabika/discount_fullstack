// components/categories/CategoryCard.js
import { brandColors } from '@/lib/colors'
import { textStyles } from '@/lib/typography'

export default function CategoryCard({ category }) {
  return (
    <a
      href={`/category/${category.id}`}
      style={{
        display: 'block',
        padding: '24px',
        backgroundColor: brandColors.white,
        borderRadius: '12px',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'all 0.2s ease',
        textAlign: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: `1px solid ${brandColors.gray[200]}`
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'translateY(-4px)'
        e.target.style.boxShadow = '0 8px 15px rgba(0,0,0,0.15)'
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'translateY(0)'
        e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      <div style={{
        fontSize: '2.5rem',
        marginBottom: '12px'
      }}>
        {category.icon || '🏷️'}
      </div>
      <h3 style={{
        ...textStyles.h5,
        marginBottom: '8px'
      }}>
        {category.name}
      </h3>
      {category.description && (
        <p style={{
          ...textStyles.body,
          fontSize: '14px',
          opacity: 0.8
        }}>
          {category.description}
        </p>
      )}
    </a>
  )
}