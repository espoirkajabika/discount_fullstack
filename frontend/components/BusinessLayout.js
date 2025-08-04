// components/BusinessLayout.js
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { 
  BarChart3,
  Tag, 
  ShoppingBag,
  TrendingUp,
  Settings,
  LogOut,
  MapPin,
  Bell,
  RefreshCw,
  User
} from 'lucide-react'

// Sidebar Navigation Component
function Sidebar({ activeTab, setActiveTab, onLogout, userInfo }) {
  const router = useRouter()
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/business/dashboard' },
    { id: 'offers', label: 'Offers', icon: Tag, path: '/business/offers' },
    { id: 'products', label: 'Products', icon: ShoppingBag, path: '/business/products' },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, path: '/business/analytics' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/business/settings' },
  ]

  const handleNavigation = (item) => {
    if (setActiveTab) {
      setActiveTab(item.id)
    } else {
      router.push(item.path)
    }
  }

  return (
    <div className="w-64 bg-[#1e3a5f] text-white h-screen fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="flex items-center space-x-3 p-6 border-b border-[#2a4d6e]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#e94e1b] to-red-600">
          <MapPin className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold">PopupReach</span>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-[#2a4d6e]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#2a4d6e] rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-blue-200" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">
              {userInfo?.business_name || `${userInfo?.first_name}'s Business` || 'Business Account'}
            </h2>
            <p className="text-xs text-blue-200">Business Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-left ${
                activeTab === item.id
                  ? 'bg-[#e94e1b] text-white'
                  : 'text-blue-200 hover:bg-[#2a4d6e] hover:text-white'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#2a4d6e]">
        <Button
          onClick={onLogout}
          variant="ghost"
          className="w-full text-blue-200 hover:bg-[#2a4d6e] hover:text-white justify-start"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  )
}

// Top Header Component
function TopHeader({ title, subtitle, onRefresh, refreshing, showRefresh = false, children }) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {showRefresh && onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          )}
          
          {children}
          
          <Button className="relative" size="sm">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
          </Button>
        </div>
      </div>
    </div>
  )
}

// Main Layout Component
export default function BusinessLayout({ 
  children, 
  activeTab,
  setActiveTab,
  title = "Dashboard",
  subtitle,
  onRefresh,
  refreshing = false,
  showRefresh = false,
  headerActions
}) {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  // Redirect if not business user
  if (!user || !user.is_business) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Business account required to access this page.</p>
          <Button 
            onClick={() => router.push('/business/auth/signin')} 
            className="mt-4 bg-[#e94e1b] hover:bg-[#d13f16]"
          >
            Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        userInfo={user}
      />

      {/* Main Content */}
      <div className="ml-64">
        <TopHeader 
          title={title}
          subtitle={subtitle}
          onRefresh={onRefresh}
          refreshing={refreshing}
          showRefresh={showRefresh}
        >
          {headerActions}
        </TopHeader>
        
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}