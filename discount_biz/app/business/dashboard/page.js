'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';

// Import shadcn components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  CheckCircle, 
  PieChart, 
  Clock, 
  PlusCircle, 
  Tag, 
  Settings 
} from 'lucide-react';

export default function BusinessDashboard() {
  const { user, business, isLoggedIn, initialized } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total_products: 0,
    active_offers: 0,
    total_offers: 0,
    total_claims: 0
  });
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    // Only proceed if auth is initialized
    if (!initialized) return;
    
    // If authenticated, fetch dashboard stats
    if (isLoggedIn) {
      fetchDashboardStats();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, initialized, retryCount]);

  // Function to fetch dashboard stats
  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      // Fetch products count
      const productsRes = await fetch('/api/business/products?limit=1', {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      // Fetch offers analytics
      const offersAnalyticsRes = await fetch('/api/business/offers/analytics', {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      // Handle unauthorized error
      if (offersAnalyticsRes.status === 401 && retryCount < maxRetries) {
        console.log(`Auth error in analytics. Retrying (${retryCount + 1}/${maxRetries})...`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 1000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      // Parse responses
      const productsData = await productsRes.json();
      const offersAnalyticsData = await offersAnalyticsRes.json();
      
      if (productsRes.ok && offersAnalyticsRes.ok) {
        setStats({
          total_products: productsData.pagination?.total || 0,
          active_offers: offersAnalyticsData.analytics?.active_offers || 0,
          total_offers: offersAnalyticsData.analytics?.total_offers || 0,
          total_claims: offersAnalyticsData.analytics?.total_claims || 0
        });
      } else {
        // Log errors for debugging
        if (!productsRes.ok) {
          console.error('Products API error:', productsData);
        }
        if (!offersAnalyticsRes.ok) {
          console.error('Offers analytics API error:', offersAnalyticsData);
        }
        
        setError('Failed to load dashboard statistics. Please refresh the page.');
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  // Stats card component to reduce repetition
  const StatCard = ({ icon, title, value, linkText, linkHref, iconColor }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className={`p-2 rounded-md ${iconColor}`}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 px-6 py-3">
        <Button variant="link" asChild className="px-0">
          <Link href={linkHref}>{linkText}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
    
  // Show content after auth is initialized
  if (!initialized) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      {loading ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-10 w-[250px]" />
            <Skeleton className="h-4 w-[300px]" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-md" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[100px]" />
                      <Skeleton className="h-6 w-[60px]" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/50 px-6 py-3">
                  <Skeleton className="h-4 w-[120px]" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome, {business?.business_name || user?.email}
            </h1>
            <p className="text-muted-foreground mt-1">
              Here&apos;s an overview of your business performance
            </p>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
              icon={<Package className="h-6 w-6 text-white" />}
              title="Total Products"
              value={stats.total_products}
              linkText="View all products"
              linkHref="/business/products"
              iconColor="bg-blue-500"
            />
            
            <StatCard 
              icon={<CheckCircle className="h-6 w-6 text-white" />}
              title="Active Offers"
              value={stats.active_offers}
              linkText="View active offers"
              linkHref="/business/offers?status=active"
              iconColor="bg-green-500"
            />
            
            <StatCard 
              icon={<PieChart className="h-6 w-6 text-white" />}
              title="Total Offers"
              value={stats.total_offers}
              linkText="View all offers"
              linkHref="/business/offers"
              iconColor="bg-yellow-500"
            />
            
            <StatCard 
              icon={<Clock className="h-6 w-6 text-white" />}
              title="Total Claims"
              value={stats.total_claims}
              linkText="View analytics"
              linkHref="/business/offers/analytics"
              iconColor="bg-purple-500"
            />
          </div>
          
          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:bg-accent/50 transition-colors">
                <Link href="/business/products/new" className="block h-full">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <PlusCircle className="h-5 w-5 text-blue-500" />
                      <CardTitle>Add New Product</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Add a new product to your inventory to create offers.</CardDescription>
                  </CardContent>
                </Link>
              </Card>
              
              <Card className="hover:bg-accent/50 transition-colors">
                <Link href="/business/offers/new" className="block h-full">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <Tag className="h-5 w-5 text-green-500" />
                      <CardTitle>Create New Offer</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Create a discount offer for one of your products.</CardDescription>
                  </CardContent>
                </Link>
              </Card>
              
              <Card className="hover:bg-accent/50 transition-colors">
                <Link href="/business/settings" className="block h-full">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <Settings className="h-5 w-5 text-purple-500" />
                      <CardTitle>Update Business Profile</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Edit your business information and settings.</CardDescription>
                  </CardContent>
                </Link>
              </Card>
            </div>
          </div>
          
          {/* Recent Activity */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {/* This would be populated with real activity data */}
                  <li className="p-4 flex items-center">
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-primary">Dashboard created</p>
                        <p className="mt-1 text-sm text-muted-foreground">Get started by adding products and creating offers</p>
                      </div>
                      <div className="mt-2 sm:mt-0">
                        <p className="text-sm text-muted-foreground">Just now</p>
                      </div>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}