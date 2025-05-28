// app/page.js
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { colors } from '@/lib/colors'
import { textStyles, layoutStyles } from '@/lib/styles'

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.gray[50] }}>
      {/* Hero Section */}
      <section style={{ ...layoutStyles.section, backgroundColor: colors.white }}>
        <div style={layoutStyles.container}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1 style={{ 
              ...textStyles.gradient,
              fontSize: '4rem',
              marginBottom: '16px',
              lineHeight: '1.1'
            }}>
              Discount Deals
            </h1>
            <p style={{ 
              ...textStyles.body,
              fontSize: '1.25rem',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Discover amazing deals and offers from local businesses
            </p>
          </div>
          
          <div style={{ ...layoutStyles.flexCenter, gap: '16px', flexWrap: 'wrap' }}>
            <Button variant="primary" size="lg">
              Browse Offers
            </Button>
            <Button variant="outline" size="lg">
              Sign Up Free
            </Button>
          </div>
        </div>
      </section>

      {/* Color Showcase */}
      <section style={layoutStyles.section}>
        <div style={layoutStyles.container}>
          <h2 style={{ 
            ...textStyles.heading,
            fontSize: '2rem',
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            Our Brand Colors
          </h2>
          
          <div style={{ 
            ...layoutStyles.grid,
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px'
          }}>
            <Card>
              <div style={{ 
                height: '100px',
                backgroundColor: colors.deepRed,
                borderRadius: '8px',
                marginBottom: '16px'
              }} />
              <h3 style={textStyles.subheading}>Deep Red</h3>
              <p style={textStyles.body}>#8E0D3C - Primary brand color</p>
            </Card>
            
            <Card>
              <div style={{ 
                height: '100px',
                backgroundColor: colors.blackcurrant,
                borderRadius: '8px',
                marginBottom: '16px'
              }} />
              <h3 style={textStyles.subheading}>Blackcurrant</h3>
              <p style={textStyles.body}>#1D1842 - Dark sections</p>
            </Card>
            
            <Card>
              <div style={{ 
                height: '100px',
                backgroundColor: colors.orange,
                borderRadius: '8px',
                marginBottom: '16px'
              }} />
              <h3 style={textStyles.subheading}>Orange</h3>
              <p style={textStyles.body}>#EF3B33 - Accent color</p>
            </Card>
            
            <Card>
              <div style={{ 
                height: '100px',
                backgroundColor: colors.rosePink,
                borderRadius: '8px',
                marginBottom: '16px'
              }} />
              <h3 style={textStyles.subheading}>Rose Pink</h3>
              <p style={textStyles.body}>#FDA1A2 - Light accents</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Button Showcase */}
      <section style={{ ...layoutStyles.section, backgroundColor: colors.white }}>
        <div style={layoutStyles.container}>
          <h2 style={{ 
            ...textStyles.heading,
            fontSize: '2rem',
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            Button Variations
          </h2>
          
          <div style={{ 
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            justifyContent: 'center'
          }}>
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="accent">Accent Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="gradient">Gradient Button</Button>
          </div>
        </div>
      </section>
    </div>
  )
}