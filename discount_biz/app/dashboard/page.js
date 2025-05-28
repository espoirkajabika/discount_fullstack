'use client';

import { useAuth } from '@/context/AuthContext';
import { BusinessRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarInitials } from '@/components/ui/avatar';
import { User, Building2, ShoppingBag, Tag, LogOut, Plus, ArrowRight, BarChart3, Users, TrendingUp } from 'lucide-react';
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
                {user?.is_business && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Business
                  </Badge>
                )}
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2 border-gray-200 hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.first_name || 'Business Owner'}! 👋
          </h2>
          <p className="text-gray-600 text-lg">
            Here's what's happening with your business today.
          </p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-0 bg-white"
            onClick={handleManageProducts}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Products</CardTitle>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">0</div>
              <p className="text-xs text-gray-500 flex items-center mt-1">
                <ArrowRight className="h-3 w-3 mr-1" />
                Click to manage products
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-0 bg-white"
            onClick={handleManageOffers}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Offers</CardTitle>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Tag className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">0</div>
              <p className="text-xs text-gray-500 flex items-center mt-1">
                <ArrowRight className="h-3 w-3 mr-1" />
                Click to manage offers
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Claims</CardTitle>
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">0</div>
              <p className="text-xs text-gray-500 mt-1">No claims yet</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Profile Status</CardTitle>
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">Incomplete</div>
              <p className="text-xs text-gray-500 mt-1">Setup business profile</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Next Steps */}
          <div className="lg:col-span-2">
            <Card className="border-0 bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Get Started</CardTitle>
                <CardDescription className="text-gray-600">
                  Complete these steps to get your business up and running
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg border border-green-100">
                    <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                      1
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">Complete Business Profile</h3>
                      <p className="text-sm text-gray-600 mb-3">Add your business details, category, and contact information to build trust with customers.</p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        disabled
                        className="border-gray-300 text-gray-500"
                      >
                        Coming Soon
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">Add Your First Product</h3>
                      <p className="text-sm text-gray-600 mb-3">Create a product catalog so customers know what you offer.</p>
                      <Button 
                        size="sm" 
                        onClick={handleCreateProduct}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Product
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                    <div className="w-10 h-10 rounded-full bg-yellow-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                      3
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">Create Your First Offer</h3>
                      <p className="text-sm text-gray-600 mb-3">Start attracting customers with special deals and discounts.</p>
                      <Button 
                        size="sm" 
                        onClick={handleCreateOffer}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                      >
                        <Tag className="h-4 w-4 mr-2" />
                        Create Offer
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Account Info & Quick Actions */}
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

                <div className="p-4 rounded-lg border border-gray-200 bg-gray-50 opacity-60">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-400">Business Profile</p>
                      <p className="text-xs text-gray-400">Setup your business</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">Coming Soon</p>
                </div>

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