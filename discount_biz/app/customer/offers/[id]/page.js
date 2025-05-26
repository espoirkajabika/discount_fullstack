'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/CustomerAuthContext';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StorageImage } from '@/components/ui/storage-image';
import { ClaimOfferButton } from '@/app/_components/ClaimOfferButton';
import { 
  Alert,
  AlertDescription,
  AlertTitle
} from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Icons
import { 
  Heart, 
  Tag, 
  ArrowLeft, 
  Clock, 
  Calendar, 
  Share2, 
  Store, 
  MapPin, 
  Phone, 
  ExternalLink, 
  Copy, 
  Info, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function OfferDetailsPage({ params }) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { id } = use(params);
  
  // State variables
  const [offer, setOffer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');

  // Fetch offer details when component mounts
  useEffect(() => {
    const fetchOfferDetails = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // In the future, this will be replaced with a real API call
        // For now, we'll simulate a delay and use placeholder data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Create fake offer details
        const fakeOffer = {
          id,
          discount_percentage: 35,
          discount_code: 'SUMMER35',
          start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          expiry_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: true,
          max_claims: 100,
          current_claims: 43,
          products: {
            id: 'prod-123',
            name: 'Premium Wireless Headphones',
            description: 'High-quality wireless headphones with noise cancellation technology. Perfect for travel, work, or just enjoying your favorite music without distractions.',
            price: 129.99,
            image_url: null,
          },
          business: {
            id: 'bus-456',
            business_name: 'Tech Galaxy',
            business_description: 'We sell the latest tech gadgets and accessories at competitive prices.',
            business_address: '123 Tech Boulevard, Innovation District, Techville, TX 75001',
            phone_number: '(555) 123-4567',
            business_website: 'https://tech-galaxy.example.com',
            business_hours: {
              monday: { isOpen: true, periods: [{ open: '09:00', close: '20:00' }] },
              tuesday: { isOpen: true, periods: [{ open: '09:00', close: '20:00' }] },
              wednesday: { isOpen: true, periods: [{ open: '09:00', close: '20:00' }] },
              thursday: { isOpen: true, periods: [{ open: '09:00', close: '20:00' }] },
              friday: { isOpen: true, periods: [{ open: '09:00', close: '21:00' }] },
              saturday: { isOpen: true, periods: [{ open: '10:00', close: '18:00' }] },
              sunday: { isOpen: false, periods: [{ open: '00:00', close: '00:00' }] }
            },
            avatar: null
          },
          user: {
            isSaved: false,
            isClaimed: false
          },
          calculated: {
            originalPrice: 129.99,
            finalPrice: 84.49,
            savings: 45.50,
            savingsPercentage: 35
          }
        };
        
        setOffer(fakeOffer);
        setIsSaved(fakeOffer.user?.isSaved || false);
      } catch (error) {
        console.error('Error fetching offer details:', error);
        setError('Failed to load offer details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOfferDetails();
  }, [id]);

  // Handle save/unsave offer
  const handleSaveOffer = async () => {
    if (!isLoggedIn) {
      router.push(`/customer/auth/login?redirect=/customer/offers/${id}`);
      return;
    }
    
    setIsSaving(true);
    
    try {
      // In the future, this will be a real API call
      // For now, just toggle the state after a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsSaved(!isSaved);
      
      // Show feedback to user
      if (!isSaved) {
        setCopySuccess('Offer saved to your favorites!');
      } else {
        setCopySuccess('Offer removed from your favorites');
      }
      
      // Clear the message after 3 seconds
      setTimeout(() => setCopySuccess(''), 3000);
    } catch (error) {
      console.error('Error saving/unsaving offer:', error);
      setCopySuccess('Failed to update favorites');
      setTimeout(() => setCopySuccess(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle copy code to clipboard
  const handleCopyCode = () => {
    if (offer?.discount_code) {
      navigator.clipboard.writeText(offer.discount_code);
      setCopySuccess('Code copied to clipboard!');
      setTimeout(() => setCopySuccess(''), 3000);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format time (e.g., "09:00" to "9:00 AM")
  const formatTime = (timeString) => {
    if (!timeString || timeString === '00:00') return 'Closed';
    
    const [hour, minute] = timeString.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
    
    return `${formattedHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  // Calculate days remaining until expiry
  const getDaysRemaining = () => {
    if (!offer?.expiry_date) return 0;
    
    const expiryDate = new Date(offer.expiry_date);
    const now = new Date();
    const diffTime = expiryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Check if offer is claimed by user
  const isOfferClaimed = () => {
    return offer?.user?.isClaimed || false;
  };

  // Get today's business hours
  const getTodayHours = () => {
    if (!offer?.business?.business_hours) return null;
    
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    const todayHours = offer.business.business_hours[today];
    
    if (!todayHours || !todayHours.isOpen) {
      return 'Closed today';
    }
    
    return todayHours.periods.map(period => 
      `${formatTime(period.open)} - ${formatTime(period.close)}`
    ).join(', ');
  };

  // Loading state
  if (isLoading) {
    return (
      <div>
        <div className="mb-6">
          <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          
          <Skeleton className="h-8 w-3/4 mb-4" />
          
          <div className="flex items-center">
            <Skeleton className="h-4 w-32 mr-4" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 md:h-96 w-full rounded-lg" />
            
            <div className="space-y-3">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
          
          <div>
            <Skeleton className="h-80 w-full rounded-lg" />
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
            <Link href="/customer/offers">Browse Other Offers</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Not found state
  if (!offer) {
    return (
      <div>
        <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        <Alert className="mb-6">
          <Info className="h-4 w-4 mr-2" />
          <AlertTitle>Offer Not Found</AlertTitle>
          <AlertDescription>This offer may have expired or been removed.</AlertDescription>
        </Alert>
        
        <div className="text-center py-12">
          <Button asChild>
            <Link href="/customer/offers">Browse Available Offers</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumbs */}
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/customer">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/customer/offers">Offers</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>{offer.products.name}</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Copy success notification */}
      {copySuccess && (
        <Alert className="mb-4 bg-green-50 text-green-800 border-green-100">
          <CheckCircle2 className="h-4 w-4 mr-2" />
          <AlertDescription>{copySuccess}</AlertDescription>
        </Alert>
      )}

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Product details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product image */}
          <div className="bg-gray-100 rounded-lg overflow-hidden h-64 md:h-96 flex items-center justify-center">
            <StorageImage
              path={offer.products.image_url}
              alt={offer.products.name}
              className="w-full h-full object-contain"
              fallbackSize="800x600"
              emptyIcon={<Tag className="h-24 w-24 text-gray-300" />}
            />
          </div>

          {/* Product details */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold">{offer.products.name}</h1>
              <Button 
                variant="outline" 
                size="icon" 
                className={`rounded-full ${isSaved ? 'text-red-500 bg-red-50' : ''}`}
                onClick={handleSaveOffer}
                disabled={isSaving}
              >
                <Heart className={`${isSaved ? 'fill-current' : ''}`} />
              </Button>
            </div>
            
            <div className="flex items-center mb-4">
              <Link 
                href={`/customer/businesses/${offer.business.id}`}
                className="text-blue-600 hover:underline flex items-center"
              >
                <Store className="h-4 w-4 mr-1" />
                {offer.business.business_name}
              </Link>
              
              <Badge variant="outline" className="ml-4">
                <Clock className="h-3 w-3 mr-1" />
                {getDaysRemaining()} days left
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Original Price</p>
                <p className="text-lg line-through">{formatPrice(offer.calculated.originalPrice)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Discount</p>
                <p className="text-lg font-semibold text-red-600">-{offer.discount_percentage}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Sale Price</p>
                <p className="text-2xl font-bold text-green-600">{formatPrice(offer.calculated.finalPrice)}</p>
              </div>
            </div>
          </div>

          {/* Tabs for description and business details */}
          <Tabs defaultValue="description">
            <TabsList>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="business">Business Details</TabsTrigger>
              <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="pt-4">
              <p className="text-gray-700">
                {offer.products.description || 'No description provided for this product.'}
              </p>
            </TabsContent>
            
            <TabsContent value="business" className="pt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">About {offer.business.business_name}</h3>
                  <p className="text-gray-700">{offer.business.business_description || 'No business description provided.'}</p>
                </div>
                
                {offer.business.business_address && (
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Address</h4>
                      <p className="text-gray-600">{offer.business.business_address}</p>
                    </div>
                  </div>
                )}
                
                {offer.business.phone_number && (
                  <div className="flex items-start space-x-2">
                    <Phone className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Phone</h4>
                      <p className="text-gray-600">{offer.business.phone_number}</p>
                    </div>
                  </div>
                )}
                
                {offer.business.business_website && (
                  <div className="flex items-start space-x-2">
                    <ExternalLink className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Website</h4>
                      <a 
                        href={offer.business.business_website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {offer.business.business_website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  </div>
                )}
                
                {offer.business.business_hours && (
                  <div className="flex items-start space-x-2">
                    <Clock className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Business Hours</h4>
                      <p className="text-gray-600">Today: {getTodayHours()}</p>
                      <Button variant="link" className="p-0 h-auto text-blue-600" asChild>
                        <Link href={`/customer/businesses/${offer.business.id}`}>
                          View all hours
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="terms" className="pt-4">
              <div className="space-y-3 text-gray-700">
                <p>This offer is subject to the following terms and conditions:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Offer valid from {formatDate(offer.start_date)} to {formatDate(offer.expiry_date)}</li>
                  <li>Cannot be combined with other offers or promotions</li>
                  <li>Valid only at participating locations</li>
                  {offer.max_claims && (
                    <li>Limited to {offer.max_claims} claims ({offer.current_claims} already claimed)</li>
                  )}
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right column: Claim offer */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Offer Details</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Discount badge */}
              <div className="flex justify-center">
                <div className="bg-red-100 text-red-700 font-bold text-xl px-6 py-3 rounded-full">
                  {offer.discount_percentage}% OFF
                </div>
              </div>
              
              {/* Offer details */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Validity:</span>
                  <span>{formatDate(offer.start_date)} - {formatDate(offer.expiry_date)}</span>
                </div>
                
                {offer.max_claims && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Claims:</span>
                    <span>{offer.current_claims} of {offer.max_claims}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">You Save:</span>
                  <span className="font-semibold text-green-600">{formatPrice(offer.calculated.savings)}</span>
                </div>
              </div>
              
              <Separator />
              
              {/* Discount Code */}
              {offer.discount_code && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Discount Code</label>
                  <div className="flex items-center">
                    <div className="flex-1 font-mono bg-gray-100 border px-3 py-2 rounded-l-md">
                      {offer.discount_code}
                    </div>
                    <Button 
                      variant="secondary" 
                      className="rounded-l-none" 
                      onClick={handleCopyCode}
                    >
                      <Copy className="h-4 w-4 mr-1" /> Copy
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Action buttons */}
              <div className="space-y-3">
                {/* Claim offer button */}
                {isOfferClaimed() ? (
                  <Button className="w-full" asChild>
                    <Link href={`/customer/claimed`}>
                      <CheckCircle2 className="h-4 w-4 mr-2" /> View Claimed Offer
                    </Link>
                  </Button>
                ) : (
                  <ClaimOfferButton 
                    offerId={offer.id} 
                    offerDetails={offer}
                    className="w-full"
                  />
                )}
                
                {/* Share button */}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    // Simple share implementation
                    if (navigator.share) {
                      navigator.share({
                        title: `${offer.discount_percentage}% Off ${offer.products.name}`,
                        text: `Check out this deal: ${offer.discount_percentage}% off ${offer.products.name} at ${offer.business.business_name}!`,
                        url: window.location.href
                      }).catch(err => console.error('Share failed:', err));
                    } else {
                      // Fallback to copy link
                      navigator.clipboard.writeText(window.location.href);
                      setCopySuccess('Link copied to clipboard!');
                      setTimeout(() => setCopySuccess(''), 3000);
                    }
                  }}
                >
                  <Share2 className="h-4 w-4 mr-2" /> Share
                </Button>
                
                {/* Save button (mobile-friendly duplicate) */}
                <Button 
                  variant={isSaved ? "default" : "outline"}
                  className={`w-full ${isSaved ? 'bg-red-600 hover:bg-red-700' : ''}`}
                  onClick={handleSaveOffer}
                  disabled={isSaving}
                >
                  <Heart className={`h-4 w-4 mr-2 ${isSaved ? 'fill-current' : ''}`} />
                  {isSaved ? 'Saved to Favorites' : 'Save to Favorites'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}