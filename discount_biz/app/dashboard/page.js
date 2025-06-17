'use client';

import { useAuth } from '@/context/AuthContext';
import { BusinessRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarInitials } from '@/components/ui/avatar';
import { 
  User, 
  Building2, 
  ShoppingBag, 
  Tag, 
  LogOut, 
  Plus, 
  ArrowRight, 
  BarChart3, 
  Users, 
  TrendingUp,
  CreditCard,
  QrCode
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function DashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // Handle logout
  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  // Navigation handlers
  const handleCreateOffer = () => {
    router.push('/offers/new');
  };

  const handleManageProducts = () => {
    router.push('/products');
  };

  const handleManageOffers = () => {
    router.push('/offers');
  };

  const handleCreateProduct = () => {
    router.push('/products/new');
  };

  const handleRedeemOffers = () => {
    router.push('/dashboard/redeem');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Discount Business</h1>
                <p className="text-xs text-gray-500">Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-3 py-2">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              
              <Button variant="ghost" onClick={handleLogout} className="text-gray-600 hover:text-red-600">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.first_name}!
          </h2>
          <p className="text-gray-600">
            Manage your business offers, products, and customer redemptions from your dashboard.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Offers</p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Tag className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Products</p>
                  <p className="text-2xl font-bold text-gray-900">45</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Redemptions</p>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Account Info & Quick Actions */}
          <div className="space-y-6">
            {/* Account Information */}
            <Card className="border-0 bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2 text-green-600" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                      {user?.phone && (
                        <p className="text-sm text-gray-500">{user?.phone}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {user?.is_business && (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Business User
                      </Badge>
                    )}
                    {user?.is_admin && (
                      <Badge className="bg-red-100 text-red-800 border-red-200">
                        Admin
                      </Badge>
                    )}
                    {user?.is_active && (
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">Quick Actions</CardTitle>
                <CardDescription>
                  Jump to key areas of your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    className="w-full justify-start h-12 bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleCreateOffer}
                  >
                    <Tag className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <p className="font-medium">Create New Offer</p>
                      <p className="text-xs opacity-90">Start attracting customers</p>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-12 border-gray-200 hover:bg-gray-50"
                    onClick={handleManageProducts}
                  >
                    <ShoppingBag className="h-5 w-5 mr-3 text-blue-600" />
                    <div className="text-left">
                      <p className="font-medium">Manage Products</p>
                      <p className="text-xs text-gray-500">View and edit catalog</p>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-12 border-gray-200 hover:bg-gray-50"
                    onClick={handleManageOffers}
                  >
                    <Tag className="h-5 w-5 mr-3 text-yellow-600" />
                    <div className="text-left">
                      <p className="font-medium">View All Offers</p>
                      <p className="text-xs text-gray-500">Manage existing deals</p>
                    </div>
                  </Button>

                  {/* NEW: Redeem Offers Button */}
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-12 border-green-200 hover:bg-green-50"
                    onClick={handleRedeemOffers}
                  >
                    <CreditCard className="h-5 w-5 mr-3 text-green-600" />
                    <div className="text-left">
                      <p className="font-medium">Redeem Customer Offers</p>
                      <p className="text-xs text-gray-500">Process customer redemptions</p>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Coming Soon */}
            <Card className="border-0 bg-gradient-to-br from-gray-50 to-gray-100">
              <CardHeader>
                <CardTitle className="text-lg text-gray-700">Coming Soon</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-gray-500">
                    <BarChart3 className="h-5 w-5" />
                    <span className="text-sm">Analytics Dashboard</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-500">
                    <Building2 className="h-5 w-5" />
                    <span className="text-sm">Business Profile Setup</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-500">
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-sm">Performance Reports</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Section - Quick Links */}
        <div className="mt-12">
          <Card className="border-0 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">Quick Navigation</CardTitle>
              <CardDescription>
                Access all areas of your business dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/products" className="group">
                  <div className="p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center transition-colors">
                        <ShoppingBag className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Products</p>
                        <p className="text-xs text-gray-500">Manage catalog</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                  </div>
                </Link>

                <Link href="/offers" className="group">
                  <div className="p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-yellow-100 group-hover:bg-yellow-200 rounded-lg flex items-center justify-center transition-colors">
                        <Tag className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Offers</p>
                        <p className="text-xs text-gray-500">Create & manage deals</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                  </div>
                </Link>

                {/* NEW: Redemption Link */}
                <Link href="/dashboard/redeem" className="group">
                  <div className="p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center transition-colors">
                        <CreditCard className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Redemptions</p>
                        <p className="text-xs text-gray-500">Process customer claims</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                  </div>
                </Link>

                <div className="p-4 rounded-lg border border-gray-200 bg-gray-50 opacity-60">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-400">Analytics</p>
                      <p className="text-xs text-gray-400">Performance metrics</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">Coming Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <BusinessRoute>
      <DashboardContent />
    </BusinessRoute>
  );
}