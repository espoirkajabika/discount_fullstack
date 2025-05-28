// components/layout/BannerCarousel.js
'use client'
import { useState, useEffect } from 'react'
import { brandColors } from '@/lib/colors'
import { textStyles } from '@/lib/typography'

export default function BannerCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)
  
  // Mock banner data - replace with API call
  const banners = [
    {
      id: 1,
      title: "Summer Sale - Up to 70% Off!",
      subtitle: "Limited time offers on your favorite brands",
      backgroundColor: `linear-gradient(135deg, ${brandColors.deepRed} 0%, ${brandColors.orange} 100%)`,
      textColor: brandColors.white,
      cta: "Shop Now",
      link: "/offers/summer-sale"
    },
    {
      id: 2,
      title: "New Restaurant Partners",
      subtitle: "Discover amazing dining deals in your area",
      backgroundColor: `linear-gradient(135deg, ${brandColors.blackcurrant} 0%, ${brandColors.deepRed} 100%)`,
      textColor: brandColors.white,
      cta: "Explore",
      link: "/category/food-dining"
    },
    {
      id: 3,
      title: "Weekend Special",
      subtitle: "Exclusive offers available this weekend only",
      backgroundColor: `linear-gradient(135deg, ${brandColors.rosePink} 0%, ${brandColors.orange} 100%)`,
      textColor: brandColors.blackcurrant,
      cta: "View Deals",
      link: "/offers/weekend-special"
    }
  ]

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length)
    }, 5000) // 5 seconds

    return () => clearInterval(interval)
  }, [banners.length])

  const goToSlide = (index) => {
    setCurrentSlide(index)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length)
  }

  const currentBanner = banners[currentSlide]

  return (
    <section style={{
      height: '300px',
      background: currentBanner.backgroundColor,
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      transition: 'background 0.5s ease'
    }}>
      {/* Content */}
      <div style={{
        textAlign: 'center',
        maxWidth: '800px',
        padding: '0 20px',
        zIndex: 2
      }}>
        <h2 style={{
          fontSize: '36px',
          fontWeight: '700',
          color: currentBanner.textColor,
          marginBottom: '12px',
          lineHeight: '1.2'
        }}>
          {currentBanner.title}
        </h2>
        <p style={{
          fontSize: '18px',
          color: currentBanner.textColor,
          opacity: 0.9,
          marginBottom: '24px',
          lineHeight: '1.4'
        }}>
          {currentBanner.subtitle}
        </p>
        <a
          href={currentBanner.link}
          style={{
            display: 'inline-block',
            padding: '14px 28px',
            backgroundColor: currentBanner.textColor === brandColors.white 
              ? brandColors.white 
              : brandColors.deepRed,
            color: currentBanner.textColor === brandColors.white 
              ? brandColors.deepRed 
              : brandColors.white,
            textDecoration: 'none',
            borderRadius: '25px',
            fontSize: '16px',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          {currentBanner.cta}
        </a>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        style={{
          position: 'absolute',
          left: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.2)',
          border: 'none',
          color: currentBanner.textColor,
          fontSize: '18px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = 'rgba(255,255,255,0.3)'
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'
        }}
      >
        ←
      </button>

      <button
        onClick={nextSlide}
        style={{
          position: 'absolute',
          right: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.2)',
          border: 'none',
          color: currentBanner.textColor,
          fontSize: '18px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = 'rgba(255,255,255,0.3)'
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'
        }}
      >
        →
      </button>

      {/* Dots Indicator */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '12px',
        zIndex: 2
      }}>
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: index === currentSlide 
                ? currentBanner.textColor 
                : `rgba(${currentBanner.textColor === brandColors.white ? '255,255,255' : '0,0,0'}, 0.4)`,
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>

      {/* Background Pattern (Optional) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.1,
        backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />
    </section>
  )
}