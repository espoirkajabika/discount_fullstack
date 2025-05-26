'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';

// Import components
import OfferCard from '@/app/_components/OfferCard';
import BusinessHours from '@/app/_components/BusinessHours';
import LocationMap from '@/app/_components/LocationMap';
import { Button } from '@/components/ui/button';
import { StorageImage } from '@/components/ui/storage-image';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Icons
import { 
  Store, 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Globe,
  Mail,
  AlertCircle,
  ExternalLink,
  Clock,
  Tag,
  Share2,
  ChevronRight
} from 'lucide-react';

export default function BusinessDetailsPage({ params }) {
  const router = useRouter();
  const { id } = use(params);
  
  // State variables
  const [business, setBusiness] = useState(null);
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('offers');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [shareMessage, setShareMessage] = useState('');
  
  // Fetch business details
  useEffect(() => {
    const fetchBusinessDetails = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real app, this would fetch from the API endpoint:
        // /api/customer/businesses/[id]
        // For now, we'll simulate a delay and use placeholder data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Fake business data
        const fakeBusiness = {
          id,
          business_name: `Business ${id}`,
          business_description: 'We sell the latest tech gadgets and accessories at competitive prices. Our store specializes in smartphones, laptops, and smart home devices from leading brands. We pride ourselves on providing excellent customer service and competitive prices on all the latest technology products.',
          business_address: '123 Tech Boulevard, Innovation District, Techville, TX 75001',
          business_website: 'https://tech-galaxy.example.com',
          business_email: 'info@techgalaxy.example.com',
          phone_number: '(555) 123-4567',
          categories: ['Electronics', 'Gadgets', 'Smart Home'],
          social_media: {
            facebook: 'https://facebook.com/techgalaxy',
            instagram: 'https://instagram.com/techgalaxy',
            twitter: 'https://twitter.com/techgalaxy'
          },
          avatar: null,
          business_hours: {
            monday: { isOpen: true, periods: [{ open: '09:00', close: '20:00' }] },
            tuesday: { isOpen: true, periods: [{ open: '09:00', close: '20:00' }] },
            wednesday: { isOpen: true, periods: [{ open: '09:00', close: '20:00' }] },
            thursday: { isOpen: true, periods: [{ open: '09:00', close: '20:00' }] },
            friday: { isOpen: true, periods: [{ open: '09:00', close: '21:00' }] },
            saturday: { isOpen: true, periods: [{ open: '10:00', close: '18:00' }] },
            sunday: { isOpen: false, periods: [] }
          },
          stats: {
            active_offers: 12,
            total_offers: 25,
            established: '2018'
          }
        };
        
        setBusiness(fakeBusiness);
        
        // Fetch offers for this business
        await fetchBusinessOffers();
      } catch (err) {
        console.error('Error fetching business details:', err);
        setError('Failed to load business details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBusinessDetails();
  }, [id]);

  // Fetch offers from this business
  const fetchBusinessOffers = async () => {
    try {
      // In a real app, this would fetch from the API endpoint:
      // /api/customer/offers?businessId=[id]
      // For now, we'll simulate a delay and use placeholder data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Fake offers data - generate 12 sample offers
      const fakeOffers = Array.from({ length: 12 }, (_, i) => ({
        id: `${i + 1}`,
        discount_percentage: Math.floor(Math.random() * 50) + 10,
        discount_code: Math.random() > 0.5 ? `TECH${Math.floor(Math.random() * 100)}` : null,
        start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        expiry_date: new Date(Date.now() + (Math.floor(Math.random() * 30) + 1) * 24 * 60 * 60 * 1000).toISOString(),
        products: {
          name: `Tech Product ${i + 1}`,
          price: (Math.random() * 100 + 10).toFixed(2),
          image_url: null,
        },
        business: {
          business_name: 'Tech Galaxy'
        },
        calculated: {
          originalPrice: (Math.random() * 100 + 10).toFixed(2),
        },
        user: {
          isSaved: Math.random() > 0.8,
          isClaimed: Math.random() > 0.9
        }
      }));
      
      setOffers(fakeOffers);
      setTotalPages(Math.ceil(fakeOffers.length / 6)); // 6 offers per page
    } catch (err) {
      console.error('Error fetching business offers:', err);
    }
  };

  // Share business info
  const handleShare = async () => {
    if (!business) return;
    
    const shareText = `Check out ${business.business_name} on SaverSpot!`;
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: business.business_name,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Error sharing:', err);
        // Fallback to copying the URL
        navigator.clipboard.writeText(shareUrl);
        setShareMessage('Link copied to clipboard!');
        setTimeout(() => setShareMessage(''), 3000);
      }
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(shareUrl);
      setShareMessage('Link copied to clipboard!');
      setTimeout(() => setShareMessage(''), 3000);
    }
  };

  // Handle page change for offers pagination
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Get current page offers
  const getCurrentPageOffers = () => {
    const offersPerPage = 6;
    const startIndex = (page - 1) * offersPerPage;
    const endIndex = startIndex + offersPerPage;
    return offers.slice(startIndex, endIndex);
  };

  // Loading state
  if (isLoading) {
    return (
      <div>
        <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        <div className="flex items-center mb-8">
          <Skeleton className="h-20 w-20 rounded-md" />
          <div className="ml-4">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-5 w-40" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Skeleton className="h-8 w-32 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-lg" />
              ))}
            </div>
          </div>
          
          <div>
            <Skeleton className="h-8 w-32 mb-4" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div>
        <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <div className="text-center py-12">
          <Button asChild>
            <Link href="/customer/businesses">View All Businesses</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Not found state
  if (!business) {
    return (
      <div>
        <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertTitle>Business Not Found</AlertTitle>
          <AlertDescription>This business may not exist or has been removed.</AlertDescription>
        </Alert>
        
        <div className="text-center py-12">
          <Button asChild>
            <Link href="/customer/businesses">View All Businesses</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Back button and breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <Button variant="ghost" className="self-start" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        <Breadcrumb className="mt-2 sm:mt-0">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/customer">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/customer/businesses">Businesses</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>{business.business_name}</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      {/* Share message notification */}
      {shareMessage && (
        <Alert className="mb-4 bg-green-50 text-green-700 border-green-200">
          <AlertDescription>{shareMessage}</AlertDescription>
        </Alert>
      )}
      
      {/* Business Header */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Business Avatar */}
            <div className="h-28 w-28 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
              <StorageImage
                path={business.avatar}
                alt={business.business_name}
                className="w-full h-full object-cover"
                fallbackSize="200x200"
                emptyIcon={<Store className="h-16 w-16 text-gray-300" />}
              />
            </div>
            
            {/* Business Info */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-3xl font-bold">{business.business_name}</h1>
                
                {/* Share button */}
                <Button variant="outline" size="sm" className="self-start" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
              
              {/* Categories */}
              <div className="flex flex-wrap gap-2 mt-2 mb-3">
                {business.categories?.map((category, index) => (
                  <Badge key={index} variant="secondary">
                    {category}
                  </Badge>
                ))}
              </div>
              
              {/* Quick Business Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                {business.business_address && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                    <span className="line-clamp-1">{business.business_address}</span>
                  </div>
                )}
                
                {business.phone_number && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                    <a 
                      href={`tel:${business.phone_number.replace(/[^\d+]/g, '')}`}
                      className="hover:text-blue-600"
                    >
                      {business.phone_number}
                    </a>
                  </div>
                )}
                
                {business.business_website && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Globe className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                    <a 
                      href={business.business_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 flex items-center overflow-hidden"
                    >
                      <span className="truncate">
                        {business.business_website.replace(/^https?:\/\//, '')}
                      </span>
                      <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                    </a>
                  </div>
                )}
              </div>
              
              {/* Stats badges */}
              <div className="flex flex-wrap gap-3 mt-4">
                <Badge variant="outline" className="flex items-center">
                  <Tag className="h-3.5 w-3.5 text-blue-600 mr-1" />
                  {business.stats?.active_offers || 0} active offers
                </Badge>
                
                {business.stats?.established && (
                  <Badge variant="outline" className="flex items-center">
                    <Clock className="h-3.5 w-3.5 text-gray-500 mr-1" />
                    Established {business.stats.established}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="offers">
                <Tag className="h-4 w-4 mr-2" />
                Offers
              </TabsTrigger>
              <TabsTrigger value="about">
                <Store className="h-4 w-4 mr-2" />
                About
              </TabsTrigger>
            </TabsList>
            
            {/* Offers Tab */}
            <TabsContent value="offers" className="focus-visible:outline-none focus-visible:ring-0">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Active Offers</h2>
                
                <Button asChild variant="outline" size="sm">
                  <Link href={`/customer/offers?businessId=${business.id}`}>
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
              
              {offers.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border">
                  <Tag className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No active offers</h3>
                  <p className="text-gray-500 mb-4">
                    This business doesn't have any active offers at the moment.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getCurrentPageOffers().map((offer) => (
                      <OfferCard
                        key={offer.id}
                        offer={offer}
                        size="small"
                      />
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex justify-center">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => handlePageChange(Math.max(1, page - 1))}
                              className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                          
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                isActive={pageNum === page}
                                onClick={() => handlePageChange(pageNum)}
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                              className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
            
            {/* About Tab */}
            <TabsContent value="about" className="focus-visible:outline-none focus-visible:ring-0">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-4">About {business.business_name}</h2>
                
                {business.business_description && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-lg">Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{business.business_description}</p>
                    </CardContent>
                  </Card>
                )}
                
                {/* Contact Information */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {business.business_address && (
                      <div className="flex items-start space-x-3">
                        <MapPin className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-gray-700">{business.business_address}</p>
                        </div>
                      </div>
                    )}
                    
                    {business.phone_number && (
                      <div className="flex items-center space-x-3">
                        <Phone className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        <a 
                          href={`tel:${business.phone_number.replace(/[^\d+]/g, '')}`}
                          className="text-gray-700 hover:text-blue-600"
                        >
                          {business.phone_number}
                        </a>
                      </div>
                    )}
                    
                    {business.business_email && (
                      <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        <a 
                          href={`mailto:${business.business_email}`}
                          className="text-gray-700 hover:text-blue-600"
                        >
                          {business.business_email}
                        </a>
                      </div>
                    )}
                    
                    {business.business_website && (
                      <div className="flex items-center space-x-3">
                        <Globe className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        <a 
                          href={business.business_website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-700 hover:text-blue-600 flex items-center"
                        >
                          {business.business_website.replace(/^https?:\/\//, '')}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Business Hours */}
                {business.business_hours && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-lg">Business Hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BusinessHours hours={business.business_hours} />
                    </CardContent>
                  </Card>
                )}
                
                {/* Location Map */}
                {business.business_address && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Location</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <LocationMap 
                        address={business.business_address} 
                        businessName={business.business_name}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Sidebar */}
        <div>
          {/* Quick Info Card */}
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick Contact Info */}
              <div className="space-y-4">
                {business.business_address && (
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div className="ml-2">
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="text-gray-700">{business.business_address}</p>
                    </div>
                  </div>
                )}
                
                {business.phone_number && (
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div className="ml-2">
                      <p className="text-sm text-gray-500">Phone</p>
                      <a 
                        href={`tel:${business.phone_number.replace(/[^\d+]/g, '')}`}
                        className="text-gray-700 hover:text-blue-600"
                      >
                        {business.phone_number}
                      </a>
                    </div>
                  </div>
                )}
                
                {business.business_website && (
                  <div className="flex items-start">
                    <Globe className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div className="ml-2">
                      <p className="text-sm text-gray-500">Website</p>
                      <a 
                        href={business.business_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-700 hover:text-blue-600 flex items-center"
                      >
                        <span className="truncate max-w-[150px]">
                          {business.business_website.replace(/^https?:\/\//, '')}
                        </span>
                        <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                      </a>
                    </div>
                  </div>
                )}
                
                {business.business_hours && (
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div className="ml-2 flex-1">
                      <BusinessHours hours={business.business_hours} />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-3">
                <Button 
                  className="w-full" 
                  asChild
                >
                  <Link href={`/customer/offers?businessId=${business.id}`}>
                    <Tag className="h-4 w-4 mr-2" />
                    View All Offers
                  </Link>
                </Button>
                
                {business.business_address && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      const query = encodeURIComponent(`${business.business_name}, ${business.business_address}`);
                      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                    }}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Get Directions
                  </Button>
                )}
                
                {business.phone_number && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    asChild
                  >
                    <a href={`tel:${business.phone_number.replace(/[^\d+]/g, '')}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call Business
                    </a>
                  </Button>
                )}
                
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Business
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}