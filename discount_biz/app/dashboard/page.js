'use client';

import { useAuth } from '@/context/AuthContext';
import { BusinessRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Building2, 
  ShoppingBag, 
  Tag, 
  LogOut, 
  ArrowRight, 
  BarChart3, 
  TrendingUp,
  CreditCard,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';

// Import your existing API functions
import { getOffers } from '@/lib/offers';
import { getProducts } from '@/lib/products';
import { redemptionApi } from '@/lib/redemptionApi';

function DashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // State for dashboard statistics
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOffers: 0,
    activeOffers: 0,
    totalClaims: 0,
    todayRedemptions: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch dashboard statistics using your existing API functions
  const fetchDashboardStats = async () => {
    try {
      setError(null);
      console.log('Fetching dashboard statistics...');
      
      // Fetch products data
      const productsResult = await getProducts({ page: 1, limit: 1 });
      let totalProducts = 0;
      
      if (productsResult.success) {
        totalProducts = productsResult.pagination?.total || 0;
        console.log('Total products:', totalProducts);
      } else {
        console.warn('Failed to fetch products:', productsResult.error);
      }

      // Fetch offers data with pagination info
      const offersResult = await getOffers({ page: 1, limit: 100 });
      let totalOffers = 0;
      let activeOffers = 0;
      let totalClaims = 0;
      
      if (offersResult.success) {
        totalOffers = offersResult.pagination?.total || 0;
        const offers = offersResult.offers || [];
        
        console.log('Total offers:', totalOffers);
        console.log('Offers data:', offers.length, 'offers received');
        
        // Calculate active offers (not expired and currently active)
        const now = new Date();
        activeOffers = offers.filter(offer => {
          try {
            const isActive = offer.is_active === true;
            const notExpired = new Date(offer.expiry_date) > now;
            const hasStarted = new Date(offer.start_date) <= now;
            
            return isActive && notExpired && hasStarted;
          } catch (e) {
            console.warn('Error checking offer status:', e);
            return false;
          }
        }).length;

        // Calculate total claims across all offers
        totalClaims = offers.reduce((sum, offer) => {
          try {
            return sum + (parseInt(offer.current_claims) || 0);
          } catch (e) {
            return sum;
          }
        }, 0);
        
        console.log('Active offers:', activeOffers);
        console.log('Total claims:', totalClaims);
      } else {
        console.warn('Failed to fetch offers:', offersResult.error);
      }

      // Try to fetch redemption stats (this might fail if the endpoint doesn't exist yet)
      let todayRedemptions = 0;
      try {
        const redemptionStats = await redemptionApi.getRedemptionStats(1); // Last 1 day
        if (redemptionStats && !redemptionStats.error) {
          todayRedemptions = redemptionStats.total_redemptions || 0;
          console.log('Today redemptions:', todayRedemptions);
        }
      } catch (e) {
        console.log('Redemption stats not available yet:', e.message);
      }

      // Update stats
      setStats({
        totalProducts,
        totalOffers,
        activeOffers,
        totalClaims,
        todayRedemptions
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError('Failed to load dashboard statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load stats on component mount
  useEffect(() => {
    if (user && user.is_business) {
      fetchDashboardStats();
    } else if (user && !user.is_business) {
      setError('Business account required to view statistics');
      setLoading(false);
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

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardStats();
    setRefreshing(false);
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
              {/* Refresh Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="text-gray-600 hover:text-green-600"
                title="Refresh Statistics"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>

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
              
              <Button 
                variant="ghost" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Header logout button clicked');
                  handleLogout();
                }}
                disabled={isLoggingOut}
                className="text-gray-600 hover:text-red-600 disabled:opacity-50 px-4 py-3 h-12 min-w-12 rounded-lg hover:bg-red-50"
                title={isLoggingOut ? "Signing out..." : "Sign out"}
                type="button"
              >
                {isLoggingOut ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <LogOut className="h-6 w-6" />
                )}
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

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
            <Button 
              onClick={handleRefresh}
              size="sm"
              variant="outline"
              className="mt-2 border-red-200 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Offers</p>
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      <p className="text-lg text-gray-400">Loading...</p>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{stats.activeOffers}</p>
                  )}
                  <p className="text-xs text-green-600 mt-1">Currently available</p>
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
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      <p className="text-lg text-gray-400">Loading...</p>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                  )}
                  <p className="text-xs text-blue-600 mt-1">In your catalog</p>
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
                  <p className="text-sm font-medium text-gray-600">Total Claims</p>
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      <p className="text-lg text-gray-400">Loading...</p>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{stats.totalClaims}</p>
                  )}
                  <p className="text-xs text-green-600 mt-1">Across all offers</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Offers</p>
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      <p className="text-lg text-gray-400">Loading...</p>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{stats.totalOffers}</p>
                  )}
                  <p className="text-xs text-purple-600 mt-1">Ever created</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Tag className="h-6 w-6 text-purple-600" />
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
                        <p className="text-xs text-gray-500">{loading ? 'Loading...' : `${stats.totalProducts} items`}</p>
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
                        <p className="text-xs text-gray-500">{loading ? 'Loading...' : `${stats.activeOffers} active`}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                  </div>
                </Link>

                <Link href="/dashboard/redeem" className="group">
                  <div className="p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center transition-colors">
                        <CreditCard className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Redemptions</p>
                        <p className="text-xs text-gray-500">{loading ? 'Loading...' : `${stats.totalClaims} claims`}</p>
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