'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/CustomerAuthContext';
import { use } from 'react';

// Import components
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { StorageImage } from '@/components/ui/storage-image';
import { StatusBadge } from '@/app/_components/StatusBadge';
import { RedemptionCode } from '@/app/_components/RedemptionCode';
import { RedemptionInstructions } from '@/app/_components/RedemptionInstructions';
import { RedeemOfferButton } from '@/app/_components/RedeemOfferButton';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Icons
import { 
  ArrowLeft, 
  Ticket, 
  Store, 
  MapPin, 
  Phone, 
  Globe, 
  Clock, 
  Calendar, 
  Info, 
  CheckCircle, 
  AlertCircle, 
  Tag, 
  ExternalLink, 
  Share2
} from 'lucide-react';

export default function ClaimedOfferDetailsPage({ params }) {
  const router = useRouter();
  const { isLoggedIn, isInitialized } = useAuth();
  const { id } = use(params);
  
  // State variables
  const [claimedOffer, setClaimedOffer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  
  // Redirect if not logged in
  useEffect(() => {
    if (isInitialized && !isLoggedIn) {
      router.push(`/customer/auth/login?redirect=/customer/claimed/${id}`);
    } else if (isLoggedIn) {
      fetchClaimedOfferDetails();
    }
  }, [isLoggedIn, isInitialized, id, router]);
  
  // Fetch claimed offer details from API
  const fetchClaimedOfferDetails = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/customer/claimed-offers/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Claimed offer not found');
        } else {
          throw new Error('Failed to fetch claimed offer details');
        }
      }
      
      const data = await response.json();
      setClaimedOffer(data.claimedOffer);
    } catch (error) {
      console.error('Error fetching claimed offer details:', error);
      setError(error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle share
  const handleShare = async () => {
    if (!claimedOffer) return;
    
    const shareTitle = `My claimed offer: ${claimedOffer.offer?.product?.name}`;
    const shareText = `I claimed ${claimedOffer.offer?.calculated?.savingsPercentage}% off at ${claimedOffer.offer?.business?.business_name}!`;
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Error sharing:', err);
        navigator.clipboard.writeText(shareUrl);
        setShareMessage('Link copied to clipboard!');
        setTimeout(() => setShareMessage(''), 3000);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      setShareMessage('Link copied to clipboard!');
      setTimeout(() => setShareMessage(''), 3000);
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const options = { hour: 'numeric', minute: 'numeric', hour12: true };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };
  
  // Format price with currency symbol
  const formatPrice = (price) => {
    if (!price && price !== 0) return '';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div>
        <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        <div className="mb-6">
          <Skeleton className="h-8 w-80 mb-2" />
          <Skeleton className="h-5 w-60" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
            </div>
          </div>
          
          <div>
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
            <Link href="/customer/claimed">View All Claimed Offers</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  // If no claimed offer found
  if (!claimedOffer) {
    return (
      <div>
        <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        <Alert className="mb-6">
          <Info className="h-4 w-4 mr-2" />
          <AlertTitle>Claimed Offer Not Found</AlertTitle>
          <AlertDescription>
            This claimed offer may have been deleted or doesn't exist.
          </AlertDescription>
        </Alert>
        
        <div className="text-center py-12">
          <Button asChild>
            <Link href="/customer/claimed">View All Claimed Offers</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  // Extract offer data for easier access
  const { offer, status, redemption_code, claimed_at, redeemed_at } = claimedOffer;
  const { product, business, calculated } = offer || {};
  
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
              <BreadcrumbLink href="/customer/claimed">My Offers</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>Offer Details</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      {/* Share message notification */}
      {shareMessage && (
        <Alert className="mb-4 bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{shareMessage}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Offer details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Offer image and basic details */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Product image */}
                <div className="w-full md:w-1/3 bg-gray-100 rounded-lg overflow-hidden">
                  <StorageImage
                    path={product?.image_url}
                    alt={product?.name || 'Product image'}
                    className="w-full h-full object-contain"
                    fallbackSize="400x400"
                    emptyIcon={<Tag className="h-16 w-16 text-gray-300" />}
                  />
                </div>
                
                {/* Basic offer details */}
                <div className="flex-1">
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                    <div>
                      <StatusBadge status={status} />
                    </div>
                    
                    <Badge variant="outline" className="flex items-center">
                      <Calendar className="mr-1 h-3.5 w-3.5" />
                      Claimed on {formatDate(claimed_at)}
                    </Badge>
                  </div>
                  
                  <h1 className="text-2xl font-bold mb-2">{product?.name}</h1>
                  
                  <Link 
                    href={`/customer/businesses/${business?.id}`}
                    className="text-blue-600 hover:underline flex items-center mb-4"
                  >
                    <Store className="h-4 w-4 mr-1" />
                    {business?.business_name}
                  </Link>
                  
                  <div className="flex items-center space-x-4 mb-6">
                    <div>
                      <p className="text-sm text-gray-500">Original Price</p>
                      <p className="text-lg line-through">{formatPrice(calculated?.originalPrice)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Discount</p>
                      <p className="text-lg font-semibold text-red-600">-{calculated?.savingsPercentage}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Sale Price</p>
                      <p className="text-2xl font-bold text-green-600">{formatPrice(calculated?.finalPrice)}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                    {business?.business_address && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                        <span className="line-clamp-1">{business.business_address}</span>
                      </div>
                    )}
                    
                    {offer?.expiry_date && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                        <span>Expires on {formatDate(offer.expiry_date)}</span>
                      </div>
                    )}
                    
                    {redeemed_at && (
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span>Redeemed on {formatDate(redeemed_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Product description */}
          {product?.description && (
            <Card>
              <CardHeader>
                <CardTitle>Product Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{product.description}</p>
              </CardContent>
            </Card>
          )}
          
          {/* Business details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Store className="h-5 w-5 mr-2" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {business?.business_description && (
                <div>
                  <p className="text-gray-700">{business.business_description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {business?.business_address && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Address</h4>
                      <p className="text-gray-600">{business.business_address}</p>
                      <Button variant="link" className="h-auto p-0 text-blue-600" asChild>
                        <a 
                          href={`https://maps.google.com/?q=${encodeURIComponent(business.business_address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View on Map <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
                
                {business?.phone_number && (
                  <div className="flex items-start space-x-3">
                    <Phone className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Phone</h4>
                      <a 
                        href={`tel:${business.phone_number.replace(/[^\d+]/g, '')}`}
                        className="text-blue-600 hover:underline"
                      >
                        {business.phone_number}
                      </a>
                    </div>
                  </div>
                )}
                
                {business?.business_website && (
                  <div className="flex items-start space-x-3">
                    <Globe className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Website</h4>
                      <a 
                        href={business.business_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center"
                      >
                        {business.business_website.replace(/^https?:\/\//, '')}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-4">
                <Button asChild variant="outline">
                  <Link href={`/customer/businesses/${business?.id}`}>
                    View Business Profile
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Offer terms */}
          <Card>
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                <li>Valid from {formatDate(offer?.start_date)} to {formatDate(offer?.expiry_date)}</li>
                <li>Cannot be combined with other offers or promotions</li>
                <li>Valid only at participating locations</li>
                <li>Offer must be redeemed in person</li>
                <li>Discount applies to regular-priced items only</li>
                {offer?.discount_code && (
                  <li>
                    Use discount code <span className="font-mono font-semibold">{offer.discount_code}</span> if purchasing online
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
        
        {/* Right column: Redemption code and actions */}
        <div>
          <div className="sticky top-4 space-y-4">
            {/* Redemption code card */}
            <Card>
              <CardHeader>
                <CardTitle>Your Redemption Code</CardTitle>
                <CardDescription>
                  {status === 'active' ? (
                    'Present this code to redeem your offer'
                  ) : status === 'redeemed' ? (
                    'This offer has been redeemed'
                  ) : (
                    'This offer is no longer valid'
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RedemptionCode 
                  code={redemption_code} 
                  status={status}
                  businessName={business?.business_name}
                  productName={product?.name}
                />
                
                {status === 'active' && (
                  <>
                    <Alert className="bg-blue-50 border-blue-200">
                      <Info className="h-4 w-4 text-blue-500 mr-2" />
                      <AlertDescription className="text-blue-800">
                        This code is valid until {formatDate(offer?.expiry_date)}
                      </AlertDescription>
                    </Alert>
                    
                    <RedeemOfferButton 
                      claimId={claimedOffer.id}
                      onSuccess={(redeemedOffer) => {
                        // Update the local state to reflect the redeemed status
                        setClaimedOffer({
                          ...claimedOffer,
                          status: 'redeemed',
                          redeemed_at: redeemedOffer.redeemed_at
                        });
                      }}
                      className="w-full"
                    />
                  </>
                )}
                
                {status === 'redeemed' && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <AlertDescription className="text-green-800">
                      Redeemed on {formatDate(redeemed_at)} at {formatTime(redeemed_at)}
                    </AlertDescription>
                  </Alert>
                )}
                
                {status === 'expired' && (
                  <Alert className="bg-gray-50 border-gray-200">
                    <AlertCircle className="h-4 w-4 text-gray-500 mr-2" />
                    <AlertDescription className="text-gray-800">
                      This offer expired on {formatDate(offer?.expiry_date)}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="flex justify-center border-t pt-4">
                <Button onClick={handleShare} variant="outline">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </CardFooter>
            </Card>
            
            {/* Redemption instructions */}
            <RedemptionInstructions 
              businessName={business?.business_name}
              isOnline={business?.business_website ? true : false}
              discountCode={offer?.discount_code}
              status={status}
            />
            
            {/* Actions */}
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/customer/offers/${offer?.id}`}>
                  View Original Offer
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <Link href="/customer/claimed">
                  View All My Offers
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}