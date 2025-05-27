'use client';

import { useAuth } from '@/context/AuthContext';
import { BusinessRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Building,
  ShoppingBag,
  Tag,
  LogOut,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Store,
  Briefcase
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { dashboardApi } from '@/lib/dashboard';

// Simple loading component
const SimpleLoading = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7139] mx-auto mb-4"></div>
      <p className="text-gray-600">Loading your dashboard...</p>
    </div>
  </div>
);

// Business Registration Prompt
const BusinessRegistrationPrompt = ({ user, onRegister }) => (
  <div className="min-h-screen bg-gray-50">
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Building className="h-8 w-8 text-[#FF7139] mr-3" />
            <h1 className="text-xl font-semibold text-gray-900">Business Dashboard</h1>
          </div>
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-700">
              {user?.first_name} {user?.last_name}
            </span>
            <Badge variant="outline">Regular User</Badge>
          </div>
        </div>
      </div>
    </header>

    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card className="border-2 border-[#FF7139] bg-gradient-to-br from-orange-50 to-white">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-[#FF7139] rounded-full flex items-center justify-center">
            <Store className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-gray-900">Welcome to Business Dashboard!</CardTitle>
          <CardDescription className="text-lg">
            To access business features, you need to register your business first.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-3">What you'll get:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-center space-x-2">
                <ShoppingBag className="h-4 w-4 text-[#FF7139]" />
                <span>Product Management</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Tag className="h-4 w-4 text-[#FF7139]" />
                <span>Create Offers & Deals</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <TrendingUp className="h-4 w-4 text-[#FF7139]" />
                <span>Customer Analytics</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full bg-[#FF7139] hover:bg-[#e6632e]"
              onClick={onRegister}
            >
              <Briefcase className="h-5 w-5 mr-2" />
              Register My Business
            </Button>
            <p className="text-xs text-gray-500">
              Currently logged in as: {user?.first_name} {user?.last_name} ({user?.email})
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  </div>
);

function DashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // Simple state management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalProducts: 0,
      totalOffers: 0,
      totalClaims: 0,
      activeOffers: 0,
      business: null,
      needsBusinessRegistration: false,
      user: null
    },
    profileStatus: {
      isComplete: false,
      completionPercentage: 0,
      missingFields: [],
      business: null,
      needsBusinessRegistration: false
    },
    recentActivity: {
      recentProducts: [],
      recentOffers: []
    }
  });

  // Safe data fetching
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching dashboard data...');

      // Fetch all data safely
      const [statsResult, profileResult, activityResult] = await Promise.allSettled([
        dashboardApi.getStats(),
        dashboardApi.getProfileStatus(),
        dashboardApi.getRecentActivity()
      ]);

      // Process results safely
      const stats = statsResult.status === 'fulfilled' ? statsResult.value : {
        totalProducts: 0,
        totalOffers: 0,
        totalClaims: 0,
        activeOffers: 0,
        business: null,
        needsBusinessRegistration: true,
        user: null
      };

      const profileStatus = profileResult.status === 'fulfilled' ? profileResult.value : {
        isComplete: false,
        completionPercentage: 0,
        missingFields: ['Unable to load profile'],
        business: null,
        needsBusinessRegistration: true
      };

      const recentActivity = activityResult.status === 'fulfilled' ? activityResult.value : {
        recentProducts: [],
        recentOffers: []
      };

      setDashboardData({
        stats,
        profileStatus,
        recentActivity
      });

      // Check for auth errors
      if (stats.authError) {
        setError('Please log in again to access your dashboard');
      }

      console.log('Dashboard data loaded:', { stats, profileStatus, recentActivity });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Event handlers
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleBusinessRegistration = () => {
    alert('Business registration feature coming soon! This will allow you to set up your business profile and start creating offers.');
  };

  const handleCreateProduct = () => {
    router.push('/products/new');
  };

  const handleCreateOffer = () => {
    router.push('/offers/new');
  };

  const handleManageProducts = () => {
    router.push('/products');
  };

  const handleManageOffers = () => {
    router.push('/offers');
  };

  // Show loading state
  if (loading) {
    return <SimpleLoading />;
  }

  // Show business registration for non-business users
  if (dashboardData.stats.needsBusinessRegistration || dashboardData.profileStatus.needsBusinessRegistration) {
    return (
      <BusinessRegistrationPrompt
        user={dashboardData.stats.user || user}
        onRegister={handleBusinessRegistration}
      />
    );
  }

  // Main dashboard for business users
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
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchDashboardData}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </Button>

              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-700">
                  {user?.first_name} {user?.last_name}
                </span>
                <Badge variant="secondary" className="bg-[#FF7139] text-white">
                  Business
                </Badge>
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
            {dashboardData.stats.business?.business_name ?
              `Manage ${dashboardData.stats.business.business_name} from your dashboard.` :
              'Complete your business setup to start managing offers.'
            }
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchDashboardData}
                className="text-red-600 hover:text-red-700"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleManageProducts}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#FF7139]">
                {dashboardData.stats.totalProducts || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboardData.stats.totalProducts === 0 ? 'Add your first product' : 'Click to manage products'}
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleManageOffers}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Offers</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {dashboardData.stats.activeOffers || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {(dashboardData.stats.totalOffers || 0) > (dashboardData.stats.activeOffers || 0) &&
                  `${(dashboardData.stats.totalOffers || 0) - (dashboardData.stats.activeOffers || 0)} inactive • `
                }
                {(dashboardData.stats.totalOffers || 0) === 0 ? 'Create your first offer' : 'Click to manage'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {dashboardData.stats.totalClaims || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {(dashboardData.stats.totalClaims || 0) === 0 ? 'No claims yet' : 'Customer offer claims'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile Status</CardTitle>
              {dashboardData.profileStatus.isComplete ?
                <CheckCircle className="h-4 w-4 text-green-600" /> :
                <Clock className="h-4 w-4 text-orange-600" />
              }
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${dashboardData.profileStatus.isComplete ? 'text-green-600' : 'text-orange-600'
                }`}>
                {dashboardData.profileStatus.completionPercentage || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboardData.profileStatus.isComplete ? 'Profile complete' :
                  `${(dashboardData.profileStatus.missingFields || []).length} field(s) remaining`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with your business</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleCreateProduct}
                className="bg-[#FF7139] hover:bg-[#e6632e] h-auto p-4 justify-start"
              >
                <div className="flex items-center space-x-3">
                  <Plus className="h-5 w-5" />
                  <div className="text-left">
                    <p className="font-medium">Add Product</p>
                    <p className="text-xs opacity-90">Build your product catalog</p>
                  </div>
                </div>
              </Button>

              <Button
                onClick={handleCreateOffer}
                disabled={(dashboardData.stats.totalProducts || 0) === 0}
                variant="outline"
                className="h-auto p-4 justify-start"
              >
                <div className="flex items-center space-x-3">
                  <Tag className="h-5 w-5" />
                  <div className="text-left">
                    <p className="font-medium">Create Offer</p>
                    <p className="text-xs text-gray-500">
                      {(dashboardData.stats.totalProducts || 0) === 0 ? 'Add products first' : 'Start attracting customers'}
                    </p>
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        {((dashboardData.recentActivity.recentProducts || []).length > 0 ||
          (dashboardData.recentActivity.recentOffers || []).length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {(dashboardData.recentActivity.recentProducts || []).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <ShoppingBag className="h-5 w-5 mr-2 text-[#FF7139]" />
                      Recent Products
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(dashboardData.recentActivity.recentProducts || []).slice(0, 3).map((product, index) => (
                        <div key={product.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{product.name || 'Unknown Product'}</p>
                            <p className="text-xs text-gray-500">
                              ${product.price || '0.00'} • {product.created_at ? new Date(product.created_at).toLocaleDateString() : 'Recently added'}
                            </p>
                          </div>
                          <Badge variant={product.is_active ? "default" : "secondary"}>
                            {product.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <Link href="/products">
                      <Button variant="ghost" size="sm" className="w-full mt-3">
                        View All Products <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {(dashboardData.recentActivity.recentOffers || []).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Tag className="h-5 w-5 mr-2 text-[#FF7139]" />
                      Recent Offers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(dashboardData.recentActivity.recentOffers || []).slice(0, 3).map((offer, index) => (
                        <div key={offer.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{offer.title || 'Unknown Offer'}</p>
                            <p className="text-xs text-gray-500">
                              {offer.discount_value || 0}% off • {offer.current_claims || 0} claims
                            </p>
                          </div>
                          <Badge variant={offer.is_active ? "default" : "secondary"}>
                            {offer.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <Link href="/offers">
                      <Button variant="ghost" size="sm" className="w-full mt-3">
                        View All Offers <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

        {/* No Data State */}
        {(dashboardData.stats.totalProducts || 0) === 0 && (dashboardData.stats.totalOffers || 0) === 0 && !loading && (
          <Card className="text-center py-12">
            <CardContent>
              <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to get started?</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Your business dashboard is ready! Start by adding your first product, then create offers to attract customers.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={handleCreateProduct}
                  className="bg-[#FF7139] hover:bg-[#e6632e]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Product
                </Button>
                <Button variant="outline" disabled>
                  <Building className="h-4 w-4 mr-2" />
                  Complete Business Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Access key areas of your business dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/products">
                <Button variant="outline" className="w-full justify-start h-auto p-4 hover:bg-gray-50">
                  <div className="flex items-center space-x-3 w-full">
                    <ShoppingBag className="h-5 w-5 text-[#FF7139]" />
                    <div className="text-left flex-1">
                      <p className="font-medium">Products</p>
                      <p className="text-xs text-gray-500">{dashboardData.stats.totalProducts || 0} products</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Button>
              </Link>

              <Link href="/offers">
                <Button variant="outline" className="w-full justify-start h-auto p-4 hover:bg-gray-50">
                  <div className="flex items-center space-x-3 w-full">
                    <Tag className="h-5 w-5 text-[#FF7139]" />
                    <div className="text-left flex-1">
                      <p className="font-medium">Offers</p>
                      <p className="text-xs text-gray-500">{dashboardData.stats.activeOffers || 0} active offers</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Button>
              </Link>

              <Button
                variant="outline"
                className="w-full justify-start h-auto p-4 opacity-60 cursor-not-allowed"
                disabled
              >
                <div className="flex items-center space-x-3 w-full">
                  <Building className="h-5 w-5 text-gray-400" />
                  <div className="text-left flex-1">
                    <p className="font-medium text-gray-400">Business Profile</p>
                    <p className="text-xs text-gray-400">{dashboardData.profileStatus.completionPercentage || 0}% complete</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-auto p-4 opacity-60 cursor-not-allowed"
                disabled
              >
                <div className="flex items-center space-x-3 w-full">
                  <TrendingUp className="h-5 w-5 text-gray-400" />
                  <div className="text-left flex-1">
                    <p className="font-medium text-gray-400">Analytics</p>
                    <p className="text-xs text-gray-400">{dashboardData.stats.totalClaims || 0} total claims</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Performance Summary */}
        {(dashboardData.stats.totalOffers || 0) > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-[#FF7139]" />
                Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{dashboardData.stats.totalClaims || 0}</div>
                  <p className="text-sm text-gray-600">Total Claims</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(dashboardData.stats.totalOffers || 0) > 0 ?
                      `Avg ${((dashboardData.stats.totalClaims || 0) / (dashboardData.stats.totalOffers || 1)).toFixed(1)} per offer` :
                      'No offers yet'
                    }
                  </p>
                </div>

                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {(dashboardData.stats.totalOffers || 0) > 0 ?
                      `${Math.round(((dashboardData.stats.activeOffers || 0) / (dashboardData.stats.totalOffers || 1)) * 100)}%` :
                      '0%'
                    }
                  </div>
                  <p className="text-sm text-gray-600">Active Rate</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {dashboardData.stats.activeOffers || 0} of {dashboardData.stats.totalOffers || 0} offers
                  </p>
                </div>

                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {dashboardData.profileStatus.completionPercentage || 0}%
                  </div>
                  <p className="text-sm text-gray-600">Setup Complete</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {dashboardData.profileStatus.isComplete ? 'All set!' :
                      `${(dashboardData.profileStatus.missingFields || []).length} fields remaining`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
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