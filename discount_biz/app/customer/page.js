'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/CustomerAuthContext';

// Import UI components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OfferCard from '../_components/OfferCard';

// Icons
import { 
  Search, 
  Sparkles, 
  Tag, 
  Star, 
  ArrowRight, 
  TrendingUp, 
  ShoppingBag,
  Store,
  Clock,
  Percent
} from 'lucide-react';

export default function CustomerHomePage() {
  const { isLoggedIn, customer } = useAuth();
  
  // State variables
  const [featuredOffers, setFeaturedOffers] = useState([]);
  const [trendingOffers, setTrendingOffers] = useState([]);
  const [endingSoonOffers, setEndingSoonOffers] = useState([]);
  const [highestDiscountOffers, setHighestDiscountOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("featured");
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch offers
  useEffect(() => {
    fetchOffers();
  }, []);

  // Fetch offers (mock implementation)
  const fetchOffers = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate fake offers data for each category
      const generateOffers = (count, modifier = '') => Array.from({ length: count }, (_, i) => ({
        id: `${modifier}${i + 1}`,
        discount_percentage: Math.floor(Math.random() * 50) + 10,
        discount_code: Math.random() > 0.5 ? `SAVE${Math.floor(Math.random() * 100)}` : null,
        start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        expiry_date: new Date(Date.now() + (Math.floor(Math.random() * 30) + 1) * 24 * 60 * 60 * 1000).toISOString(),
        products: {
          name: `Product ${modifier}${i + 1}`,
          price: (Math.random() * 100 + 10).toFixed(2),
          image_url: null,
        },
        business: {
          business_name: `Business ${Math.floor(i / 2) + 1}`
        },
        calculated: {
          originalPrice: (Math.random() * 100 + 10).toFixed(2),
        },
        user: {
          isSaved: Math.random() > 0.8 && isLoggedIn,
          isClaimed: Math.random() > 0.9 && isLoggedIn
        }
      }));
      
      // Create different sets of offers
      setFeaturedOffers(generateOffers(8, 'f'));
      setTrendingOffers(generateOffers(8, 't'));
      setEndingSoonOffers(generateOffers(8, 'e'));
      setHighestDiscountOffers(generateOffers(8, 'h').sort((a, b) => b.discount_percentage - a.discount_percentage));
      
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/customer/offers?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  // Function to calculate days remaining until expiry
  const getDaysRemaining = (expiryDateStr) => {
    const expiryDate = new Date(expiryDateStr);
    const now = new Date();
    const diffTime = expiryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Function to format price with discount
  const formatDiscountedPrice = (price, discountPercentage) => {
    const discountAmount = price * (discountPercentage / 100);
    const finalPrice = price - discountAmount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(finalPrice);
  };

  return (
    <div>
      {/* Hero section with search */}
      <section className="py-12 px-4 text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Discover Amazing Deals <br className="hidden sm:inline" />
          from Local Businesses
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Find and save on the best offers from your favorite stores and services
        </p>
        
        <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input 
            type="text"
            placeholder="Search for offers, businesses, or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-24 py-6 text-base"
          />
          <Button 
            className="absolute right-1 top-1/2 -translate-y-1/2" 
            type="submit"
          >
            Search
          </Button>
        </form>

        {isLoggedIn && (
          <p className="mt-4 text-gray-600">
            Welcome back, {customer?.first_name || 'valued customer'}!
          </p>
        )}
      </section>

      {/* Featured Offers Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Sparkles className="text-yellow-500 mr-2" />
            <h2 className="text-2xl font-bold">Featured Offers</h2>
          </div>
          <Button variant="ghost" asChild>
            <Link href="/customer/offers">
              View all <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="featured" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="featured" className="flex items-center">
              <Tag className="h-4 w-4 mr-2 hidden sm:block" />
              Featured
            </TabsTrigger>
            <TabsTrigger value="trending" className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 hidden sm:block" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="ending-soon" className="flex items-center">
              <Clock className="h-4 w-4 mr-2 hidden sm:block" />
              Ending Soon
            </TabsTrigger>
            <TabsTrigger value="highest-discount" className="flex items-center">
              <Percent className="h-4 w-4 mr-2 hidden sm:block" />
              Best Deals
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              <TabsContent value="featured" className="m-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {featuredOffers.slice(0, 4).map((offer) => (
                    <OfferCard key={offer.id} offer={offer} />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="trending" className="m-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {trendingOffers.slice(0, 4).map((offer) => (
                    <OfferCard key={offer.id} offer={offer} />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="ending-soon" className="m-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {endingSoonOffers.slice(0, 4).map((offer) => (
                    <OfferCard key={offer.id} offer={offer} />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="highest-discount" className="m-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {highestDiscountOffers.slice(0, 4).map((offer) => (
                    <OfferCard key={offer.id} offer={offer} />
                  ))}
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </section>

      {/* Popular Categories */}
      <section className="mb-12">
        <div className="flex items-center mb-6">
          <Star className="text-amber-500 mr-2" />
          <h2 className="text-2xl font-bold">Popular Categories</h2>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {[
            { name: 'Food & Drink', icon: <ShoppingBag className="h-6 w-6" /> },
            { name: 'Fashion', icon: <ShoppingBag className="h-6 w-6" /> },
            { name: 'Electronics', icon: <ShoppingBag className="h-6 w-6" /> },
            { name: 'Beauty', icon: <ShoppingBag className="h-6 w-6" /> },
            { name: 'Home', icon: <ShoppingBag className="h-6 w-6" /> },
            { name: 'Entertainment', icon: <ShoppingBag className="h-6 w-6" /> },
          ].map((category, index) => (
            <Link href={`/customer/offers?category=${category.name}`} key={index}>
              <Card className="flex flex-col items-center justify-center p-4 h-full hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="bg-blue-100 p-3 rounded-full mb-3">
                  {category.icon}
                </div>
                <span className="text-center font-medium">{category.name}</span>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Businesses */}
      <section className="mb-12">
        <div className="flex items-center mb-6">
          <TrendingUp className="text-green-500 mr-2" />
          <h2 className="text-2xl font-bold">Trending Businesses</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Tech Galaxy', offers: 12, desc: 'Latest tech gadgets and accessories at amazing prices' },
            { name: 'Fashion Forward', offers: 8, desc: 'Trendy clothing and accessories for all seasons' },
            { name: 'Healthy Bites', offers: 5, desc: 'Organic food and health supplements' }
          ].map((business, index) => (
            <Link href={`/customer/businesses/${index + 1}`} key={index}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <div className="p-6">
                  <h3 className="font-bold text-lg mb-2">{business.name}</h3>
                  <p className="text-gray-600 mb-3">{business.desc}</p>
                  <div className="text-sm text-blue-600">{business.offers} active offers</div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white mb-8">
        <div className="md:w-3/4 mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Start saving today!</h2>
          <p className="text-lg mb-6 text-blue-100">
            Create an account to save your favorite offers and get personalized recommendations.
          </p>
          {!isLoggedIn && (
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" variant="secondary">
                <Link href="/customer/auth/login">Log in</Link>
              </Button>
              <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                <Link href="/customer/auth/signup">Sign up free</Link>
              </Button>
            </div>
          )}
          {isLoggedIn && (
            <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              <Link href="/customer/offers">Browse all offers</Link>
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}