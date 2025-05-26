'use client';

import { useAuth } from '@/context/AuthContext';
import { BusinessRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Building, ShoppingBag, Tag, LogOut, Plus, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-[#FF7139] mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Business Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-700">
                  {user?.first_name} {user?.last_name}
                </span>
                {user?.is_business && (
                  <Badge variant="secondary" className="bg-[#FF7139] text-white">
                    Business
                  </Badge>
                )}
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
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
            Welcome back, {user?.first_name || 'Business Owner'}!
          </h2>
          <p className="text-gray-600">
            Manage your business, products, and offers from your dashboard.
          </p>
        </div>

        {/* User Info Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Account Information</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                {user?.phone && (
                  <p className="text-xs text-gray-500">{user?.phone}</p>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  {user?.is_business && (
                    <Badge variant="secondary" className="text-xs">Business User</Badge>
                  )}
                  {user?.is_admin && (
                    <Badge variant="destructive" className="text-xs">Admin</Badge>
                  )}
                  {user?.is_active && (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-600">Active</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Business Status</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#FF7139]">Getting Started</div>
              <p className="text-xs text-muted-foreground">
                Complete your business profile to start creating offers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  size="sm" 
                  className="w-full bg-[#FF7139] hover:bg-[#e6632e]"
                  onClick={handleCreateOffer}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Offer
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={handleManageProducts}
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Manage Products
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleManageProducts}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Click to manage products
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleManageOffers}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Offers</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Click to manage offers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">No claims yet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile Status</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">Incomplete</div>
              <p className="text-xs text-muted-foreground">Setup business profile</p>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>
              Complete these steps to get your business up and running
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-[#FF7139] text-white flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium">Complete Business Profile</p>
                  <p className="text-sm text-gray-500">Add your business details, category, and contact information</p>
                </div>
                <Button size="sm" variant="outline" disabled>
                  Coming Soon
                </Button>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-[#FF7139] text-white flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium">Add Your First Product</p>
                  <p className="text-sm text-gray-500">Create a product catalog for your business</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleCreateProduct}
                  className="flex items-center space-x-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Product</span>
                </Button>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-[#FF7139] text-white flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium">Create Your First Offer</p>
                  <p className="text-sm text-gray-500">Start attracting customers with special deals</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleCreateOffer}
                  className="flex items-center space-x-1"
                >
                  <Tag className="h-3 w-3" />
                  <span>Create Offer</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
              <CardDescription>
                Access key areas of your business dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/products">
                  <Button variant="outline" className="w-full justify-start h-auto p-4">
                    <div className="flex items-center space-x-3">
                      <ShoppingBag className="h-5 w-5 text-[#FF7139]" />
                      <div className="text-left">
                        <p className="font-medium">Products</p>
                        <p className="text-xs text-gray-500">Manage your product catalog</p>
                      </div>
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </div>
                  </Button>
                </Link>

                <Link href="/offers">
                  <Button variant="outline" className="w-full justify-start h-auto p-4">
                    <div className="flex items-center space-x-3">
                      <Tag className="h-5 w-5 text-[#FF7139]" />
                      <div className="text-left">
                        <p className="font-medium">Offers</p>
                        <p className="text-xs text-gray-500">Create and manage deals</p>
                      </div>
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </div>
                  </Button>
                </Link>

                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto p-4" 
                  disabled
                >
                  <div className="flex items-center space-x-3">
                    <Building className="h-5 w-5 text-gray-400" />
                    <div className="text-left">
                      <p className="font-medium text-gray-400">Business Profile</p>
                      <p className="text-xs text-gray-400">Setup your business</p>
                    </div>
                    <ArrowRight className="h-4 w-4 ml-auto text-gray-400" />
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto p-4" 
                  disabled
                >
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div className="text-left">
                      <p className="font-medium text-gray-400">Analytics</p>
                      <p className="text-xs text-gray-400">View performance metrics</p>
                    </div>
                    <ArrowRight className="h-4 w-4 ml-auto text-gray-400" />
                  </div>
                </Button>
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