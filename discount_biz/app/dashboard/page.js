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
  AlertCircle,
  Phone,
  Globe,
  MapPin,
  Mail
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
  
  // State for business profile data
  const [businessProfile, setBusinessProfile] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

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

  // Fetch dashboard statistics using your existing API functions
  const fetchDashboardStats = async () => {
    try {
      setError(null);
      console.log('Fetching dashboard statistics...');
      
      // Fetch business profile
      await fetchBusinessProfile();
      
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
            console.error('Error checking offer dates:', e);
            return false;
          }
        }).length;

        // Calculate total claims
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

      // Update stats
      setStats({
        totalProducts,
        totalOffers,
        activeOffers,
        totalClaims,
        todayRedemptions: 0 // You can implement this later
      });

      console.log('Dashboard statistics updated successfully');
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError('Unable to load dashboard statistics. Please try again.');
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

  const handleSettings = () => {
    router.push('/settings');
  };

  // Get business name for display
  const getBusinessDisplayName = () => {
    if (businessProfile?.business_name) {
      return businessProfile.business_name;
    }
    return 'Business';
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

              {/* Business Profile Display */}
              <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-3 py-2">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {getBusinessDisplayName()}
                  </p>
                  <p className="text-xs text-gray-500">Admin</p>
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
            Welcome back, Admin
          </h2>
          <p className="text-gray-600">
            Manage your business offers, products, and customer redemptions from your dashboard.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            <span className="ml-2 text-gray-600">Loading dashboard...</span>
          </div>
        )}

        {/* Main Dashboard Content */}
        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Stats */}
            <div className="lg:col-span-2 space-y-8">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total Products */}
                <Card className="border-0 bg-white shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Total Products
                    </CardTitle>
                    <ShoppingBag className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalProducts}</div>
                    <p className="text-xs text-gray-500">
                      Products in your catalog
                    </p>
                  </CardContent>
                </Card>

                {/* Total Offers */}
                <Card className="border-0 bg-white shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Total Offers
                    </CardTitle>
                    <Tag className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalOffers}</div>
                    <p className="text-xs text-gray-500">
                      Offers created
                    </p>
                  </CardContent>
                </Card>

                {/* Active Offers */}
                <Card className="border-0 bg-white shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Active Offers
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{stats.activeOffers}</div>
                    <p className="text-xs text-gray-500">
                      Currently active
                    </p>
                  </CardContent>
                </Card>

                {/* Total Claims */}
                <Card className="border-0 bg-white shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Total Claims
                    </CardTitle>
                    <CreditCard className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalClaims}</div>
                    <p className="text-xs text-gray-500">
                      Customer claims
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">Quick Actions</CardTitle>
                  <CardDescription>
                    Manage your business operations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      onClick={handleCreateOffer}
                      className="w-full justify-start h-12 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Tag className="h-4 w-4 mr-2" />
                      Create New Offer
                    </Button>
                    
                    <Button 
                      onClick={handleManageProducts}
                      variant="outline"
                      className="w-full justify-start h-12 border-gray-300 hover:border-blue-500 hover:text-blue-600"
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Manage Products
                    </Button>
                    
                    <Button 
                      onClick={handleManageOffers}
                      variant="outline"
                      className="w-full justify-start h-12 border-gray-300 hover:border-green-500 hover:text-green-600"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View All Offers
                    </Button>
                    
                    <Button 
                      onClick={handleRedeemOffers}
                      variant="outline"
                      className="w-full justify-start h-12 border-gray-300 hover:border-purple-500 hover:text-purple-600"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Redeem Offers
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Business Profile */}
            <div className="space-y-8">
              {/* Business Profile Card */}
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">Business Profile</CardTitle>
                  <CardDescription>
                    Your business information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Business Name */}
                    <div className="flex items-start space-x-3">
                      <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {businessProfile?.business_name || 'Business Name Not Set'}
                        </p>
                        <p className="text-xs text-gray-500">Business Name</p>
                      </div>
                    </div>

                    {/* Business Description */}
                    {businessProfile?.business_description && (
                      <div className="flex items-start space-x-3">
                        <User className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-900">
                            {businessProfile.business_description}
                          </p>
                          <p className="text-xs text-gray-500">Description</p>
                        </div>
                      </div>
                    )}

                    {/* Business Address */}
                    {businessProfile?.business_address && (
                      <div className="flex items-start space-x-3">
                        <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-900">
                            {businessProfile.business_address}
                          </p>
                          <p className="text-xs text-gray-500">Address</p>
                        </div>
                      </div>
                    )}

                    {/* Phone Number */}
                    {businessProfile?.phone_number && (
                      <div className="flex items-start space-x-3">
                        <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-900">
                            {businessProfile.phone_number}
                          </p>
                          <p className="text-xs text-gray-500">Phone</p>
                        </div>
                      </div>
                    )}

                    {/* Website */}
                    {businessProfile?.business_website && (
                      <div className="flex items-start space-x-3">
                        <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-900">
                            <a 
                              href={businessProfile.business_website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {businessProfile.business_website}
                            </a>
                          </p>
                          <p className="text-xs text-gray-500">Website</p>
                        </div>
                      </div>
                    )}

                    {/* Edit Profile Button */}
                    {/* <div className="pt-4 border-t">
                      <Button 
                        onClick={handleSettings}
                        variant="outline"
                        className="w-full justify-center"
                      >
                        Edit Business Profile
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div> */}
                  </div>
                </CardContent>
              </Card>

              {/* Account Info - Keep original user info for admin reference */}
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">Account Info</CardTitle>
                  <CardDescription>
                    Administrative account details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
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
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <BusinessRoute>
      <DashboardContent />
    </BusinessRoute>
  );
}