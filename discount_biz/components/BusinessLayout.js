// components/BusinessLayout.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { BusinessRoute } from '@/components/ProtectedRoute';
import { 
  User, 
  Building2, 
  ShoppingBag, 
  Tag, 
  LogOut, 
  BarChart3,
  Settings,
  Home,
  Bell,
  Loader2,
  RefreshCw
} from 'lucide-react';

// Sidebar Navigation Component
function Sidebar({ activeTab, setActiveTab, onLogout, isLoggingOut }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'offers', label: 'Offers', icon: Tag, path: '/offers' },
    { id: 'products', label: 'Products', icon: ShoppingBag, path: '/products' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  // Determine active tab based on current pathname
  useEffect(() => {
    const currentItem = menuItems.find(item => pathname.startsWith(item.path));
    if (currentItem) {
      setActiveTab(currentItem.id);
    }
  }, [pathname, setActiveTab]);

  const handleNavigation = (item) => {
    setActiveTab(item.id);
    if (pathname !== item.path) {
      router.push(item.path);
    }
  };

  return (
    <div className="w-64 bg-slate-800 min-h-screen flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">PopupReach</h1>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleNavigation(item)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === item.id
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={onLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
        >
          {isLoggingOut ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <LogOut className="h-5 w-5" />
          )}
          <span>{isLoggingOut ? 'Signing out...' : 'Logout'}</span>
        </button>
      </div>
    </div>
  );
}

// Header Component
function Header({ user, businessProfile, onRefresh, refreshing, title, subtitle }) {
  const getBusinessDisplayName = () => {
    if (businessProfile?.business_name) {
      return businessProfile.business_name;
    }
    return user?.first_name || 'Admin';
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      {/* Page Title or Welcome Message */}
      <div>
        {title ? (
          <>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
          </>
        ) : (
          <h2 className="text-xl font-bold text-gray-900">
            Welcome back, {getBusinessDisplayName()}
          </h2>
        )}
      </div>

      {/* Right Side - User Info and Actions */}
      <div className="flex items-center space-x-4">
        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
            title="Refresh"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        )}

        {/* Notifications */}
        <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full">
          <Bell className="h-5 w-5" />
        </button>

        {/* User Avatar */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-900 hidden sm:block">
            {user?.first_name} {user?.last_name}
          </span>
        </div>
      </div>
    </header>
  );
}

// Main Layout Component
function BusinessLayout({ 
  children, 
  title, 
  subtitle, 
  onRefresh, 
  refreshing = false,
  showRefresh = false 
}) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [businessProfile, setBusinessProfile] = useState(null);

  // Fetch business profile data
  const fetchBusinessProfile = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'}/business/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBusinessProfile(data.business);
      }
    } catch (error) {
      console.error('Error fetching business profile:', error);
    }
  };

  // Load business profile on mount
  useEffect(() => {
    if (user && user.is_business) {
      fetchBusinessProfile();
    }
  }, [user]);

  // Handle logout with loading state
  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    console.log('Logout button clicked');
    
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <BusinessRoute>
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          isLoggingOut={isLoggingOut}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <Header 
            user={user}
            businessProfile={businessProfile}
            onRefresh={showRefresh ? onRefresh : null}
            refreshing={refreshing}
            title={title}
            subtitle={subtitle}
          />

          {/* Main Content Area */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </BusinessRoute>
  );
}

export default BusinessLayout;