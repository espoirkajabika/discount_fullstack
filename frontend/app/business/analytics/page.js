'use client'

import { useAuth } from '@/context/AuthContext'
import BusinessLayout from '@/components/BusinessLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Clock,
  Target,
  PieChart,
  LineChart,
  Calendar,
  DollarSign,
  MapPin,
  Star,
  Activity,
  Zap
} from 'lucide-react'

export default function AnalyticsComingSoon() {
  const { user } = useAuth()

  if (!user || !user.is_business) {
    return null
  }

  return (
    <BusinessLayout
      title="Analytics"
      subtitle="Detailed insights and performance metrics for your business"
      activeTab="analytics"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Section */}
        <Card className="bg-gradient-to-br from-[#1e3a5f] to-[#2a4d6e] border-0 text-white">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row items-center justify-between">
              <div className="text-center lg:text-left mb-6 lg:mb-0">
                <div className="flex items-center justify-center lg:justify-start space-x-3 mb-4">
                  <div className="w-16 h-16 bg-[#e94e1b] rounded-full flex items-center justify-center">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">Advanced Analytics</h1>
                    <p className="text-blue-200 text-lg">Coming Soon</p>
                  </div>
                </div>
                <p className="text-xl text-blue-100 max-w-2xl leading-relaxed">
                  We're building comprehensive analytics to help you understand your customers, track performance, and grow your business with data-driven insights.
                </p>
              </div>
              
              <div className="w-32 h-32 bg-white bg-opacity-10 rounded-full flex items-center justify-center">
                <Clock className="w-16 h-16 text-[#e94e1b]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="bg-[#e94e1b] text-white">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Want to be notified when analytics are ready?</h3>
            <p className="text-red-100 mb-6 max-w-2xl mx-auto">
              We'll keep you updated on our progress and let you know as soon as these powerful analytics features become available.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="outline" 
                className="bg-white text-[#e94e1b] border-white hover:bg-red-50"
                onClick={() => router.push('/business/dashboard')}
              >
                Back to Dashboard
              </Button>
              <Button 
                className="bg-white bg-opacity-20 text-white border-white border hover:bg-opacity-30"
                onClick={() => window.open('mailto:support@popupreach.com?subject=Analytics Update Request')}
              >
                Request Updates
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </BusinessLayout>
  )
}