// app/dashboard/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import BusinessLayout from '@/components/BusinessLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingBag, 
  Tag, 
  TrendingUp,
  CreditCard,
  Loader2,
  AlertCircle,
  BarChart3
} from 'lucide-react';

// Import your existing API functions
import { getOffers } from '@/lib/offers';
import { getProducts } from '@/lib/products';

// Stats Card Component
function StatsCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

// Quick Actions Component
function QuickActions({ onCreateOffer, onManageProducts, onManageOffers, onRedeemOffers }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={onCreateOffer}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Tag className="h-5 w-5" />
          <span>Create offer</span>
        </button>
        <button
          onClick={onManageProducts}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <ShoppingBag className="h-5 w-5" />
          <span>New Product</span>
        </button>
        <button
          onClick={onManageOffers}
          className="border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-3 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <BarChart3 className="h-5 w-5" />
          <span>View All Offers</span>
        </button>
        <button
          onClick={onRedeemOffers}
          className="border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-3 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <CreditCard className="h-5 w-5" />
          <span>Redeem Offers</span>
        </button>
      </div>
    </div>
  );
}

// Recent Offers Component  
function RecentOffers({ offers, loading, onCreateOffer }) {
  const [activeTab, setActiveTab] = useState('all');

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      }).toLowerCase();
    } catch (e) {
      return 'Invalid date';
    }
  };

  const getOfferStatus = (offer) => {
    try {
      const now = new Date();
      const isActive = offer.is_active === true;
      const notExpired = new Date(offer.expiry_date) > now;
      const hasStarted = new Date(offer.start_date) <= now;
      
      if (!isActive) return 'Inactive';
      if (!hasStarted) return 'Upcoming';
      if (!notExpired) return 'Expired';
      return 'Active';
    } catch (e) {
      return 'Unknown';
    }
  };

  // Filter offers based on active tab
  const getFilteredOffers = () => {
    if (!offers || offers.length === 0) return [];
    
    if (activeTab === 'all') return offers;
    
    return offers.filter(offer => {
      const status = getOfferStatus(offer);
      return status.toLowerCase() === activeTab.toLowerCase();
    });
  };

  const filteredOffers = getFilteredOffers();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          <span className="ml-2 text-gray-600">Loading offers...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Offers</h3>
        <button 
          onClick={onCreateOffer}
          className="text-orange-500 hover:text-orange-600 text-sm font-medium"
        >
          Create offer
        </button>
      </div>
      
      {/* Tabs */}
      <div className="flex space-x-6 mb-4 border-b">
        <button 
          onClick={() => setActiveTab('all')}
          className={`pb-2 text-sm font-medium transition-colors ${
            activeTab === 'all'
              ? 'text-gray-900 border-b-2 border-orange-500'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          All
        </button>
        <button 
          onClick={() => setActiveTab('active')}
          className={`pb-2 text-sm font-medium transition-colors ${
            activeTab === 'active'
              ? 'text-gray-900 border-b-2 border-orange-500'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Active
        </button>
        <button 
          onClick={() => setActiveTab('expired')}
          className={`pb-2 text-sm font-medium transition-colors ${
            activeTab === 'expired'
              ? 'text-gray-900 border-b-2 border-orange-500'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Expired
        </button>
        <button 
          onClick={() => setActiveTab('upcoming')}
          className={`pb-2 text-sm font-medium transition-colors ${
            activeTab === 'upcoming'
              ? 'text-gray-900 border-b-2 border-orange-500'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Upcoming
        </button>
      </div>

      {/* Offers List */}
      <div className="space-y-4">
        {filteredOffers && filteredOffers.length > 0 ? (
          filteredOffers.slice(0, 2).map((offer) => (
            <div key={offer.id} className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">
                  {offer.discount_percentage}% off {offer.product_name || offer.description || 'Product'}
                </h4>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  getOfferStatus(offer) === 'Active' 
                    ? 'bg-green-100 text-green-800'
                    : getOfferStatus(offer) === 'Expired'
                    ? 'bg-red-100 text-red-800'
                    : getOfferStatus(offer) === 'Upcoming'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {getOfferStatus(offer)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Start date</span>
                  <p className="font-medium text-gray-900">{formatDate(offer.start_date)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Views</span>
                  <p className="font-medium text-gray-900">{offer.view_count || 0}</p>
                </div>
                <div>
                  <span className="text-gray-500">Claims</span>
                  <p className="font-medium text-gray-900">{offer.current_claims || 0}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            {activeTab === 'all' 
              ? 'No offers found. Create your first offer to get started!'
              : `No ${activeTab} offers found.`
            }
          </div>
        )}
      </div>
      
      <button className="text-orange-500 hover:text-orange-600 text-sm font-medium mt-4">
        view all
      </button>
    </div>
  );
}

// Products Table Component
function ProductsTable({ products, loading, onNewProduct }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          <span className="ml-2 text-gray-600">Loading products...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Products</h3>
        <button 
          onClick={onNewProduct}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <span>+ New Product</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-900">Name</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Price</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Action</th>
            </tr>
          </thead>
          <tbody>
            {products && products.length > 0 ? (
              products.slice(0, 5).map((product, index) => (
                <tr key={product.id || index} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-900">{product.name}</td>
                  <td className="py-3 px-4 text-gray-600">{product.category || 'Uncategorized'}</td>
                  <td className="py-3 px-4 text-gray-900">${product.price || '0.00'}</td>
                  <td className="py-3 px-4">
                    <button className="text-orange-500 hover:text-orange-600 text-sm">
                      Create offer
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="py-8 text-center text-gray-500">
                  No products found. Add your first product to get started!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <button className="text-orange-500 hover:text-orange-600 text-sm font-medium mt-4">
        view all
      </button>
    </div>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  
  // State for dashboard statistics
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOffers: 0,
    activeOffers: 0,
    totalClaims: 0,
    todayRedemptions: 0
  });
  
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch dashboard statistics using your existing API functions
  const fetchDashboardStats = async () => {
    try {
      setError(null);
      console.log('Fetching dashboard statistics...');
      
      // Fetch products data
      const productsResult = await getProducts({ page: 1, limit: 100 });
      let totalProducts = 0;
      
      if (productsResult.success) {
        totalProducts = productsResult.pagination?.total || 0;
        setProducts(productsResult.products || []);
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
        const offersData = offersResult.offers || [];
        setOffers(offersData);
        
        console.log('Total offers:', totalOffers);
        console.log('Offers data:', offersData.length, 'offers received');
        
        // Calculate active offers (not expired and currently active)
        const now = new Date();
        activeOffers = offersData.filter(offer => {
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
        totalClaims = offersData.reduce((sum, offer) => {
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

  const handleNewProduct = () => {
    router.push('/products/new');
  };

  const statsCards = [
    { title: 'Active Offers', value: stats.activeOffers, icon: Tag, color: 'bg-green-500' },
    { title: 'Claims', value: stats.totalClaims, icon: CreditCard, color: 'bg-purple-500' },
    { title: 'Products', value: stats.totalProducts, icon: ShoppingBag, color: 'bg-blue-500' },
  ];

  return (
    <BusinessLayout
      onRefresh={handleRefresh}
      refreshing={refreshing}
      showRefresh={true}
    >
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <span className="ml-2 text-gray-600">Loading dashboard...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statsCards.map((card, index) => (
              <StatsCard
                key={index}
                title={card.title}
                value={card.value}
                icon={card.icon}
                color={card.color}
              />
            ))}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <RecentOffers 
                offers={offers} 
                loading={false}
                onCreateOffer={handleCreateOffer}
              />
              <ProductsTable 
                products={products}
                loading={false}
                onNewProduct={handleNewProduct}
              />
            </div>

            {/* Right Column - Quick Actions */}
            <div className="space-y-6">
              <QuickActions
                onCreateOffer={handleCreateOffer}
                onManageProducts={handleManageProducts}
                onManageOffers={handleManageOffers}
                onRedeemOffers={handleRedeemOffers}
              />
            </div>
          </div>
        </div>
      )}
    </BusinessLayout>
  );
}

export default DashboardContent;