'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react'; // Import the use function
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  AlertCircle, 
  ArrowLeft, 
  Calendar, 
  Copy, 
  Edit, 
  Share2, 
  Trash, 
  TrendingUp,
  CheckCircle2,
  Circle,
  Clock,
  Tag
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { StorageImage } from '@/components/ui/storage-image';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function OfferDetailsPage({ params }) {
  // Use the React.use method to unwrap the params
  const id = use(params).id;
  
  const router = useRouter();
  const [offer, setOffer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isToggling, setIsToggling] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Fetch offer data
  useEffect(() => {
    const fetchOffer = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/business/offers/${id}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication failed. Please login again.');
          }
          throw new Error('Failed to fetch offer details');
        }

        const data = await response.json();
        setOffer(data.offer);
      } catch (err) {
        console.error('Error fetching offer:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffer();
  }, [id]);

  // Handle toggle offer active status
  const handleToggleActive = async () => {
    if (isToggling) return;
    
    setIsToggling(true);
    
    try {
      const newStatus = !offer.is_active;
      
      const response = await fetch(`/api/business/offers/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: newStatus }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update offer status');
      }

      const data = await response.json();
      setOffer(data.offer);
    } catch (err) {
      console.error('Error toggling offer status:', err);
      setError(`Failed to ${offer.is_active ? 'deactivate' : 'activate'} offer: ${err.message}`);
    } finally {
      setIsToggling(false);
    }
  };

  // Handle delete offer
  const handleDeleteOffer = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/business/offers/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete offer');
      }

      // Redirect to offers list
      router.push('/business/offers');
    } catch (err) {
      console.error('Error deleting offer:', err);
      setError('Failed to delete offer: ' + err.message);
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Handle copy discount code
  const handleCopyCode = () => {
    if (offer.discount_code) {
      navigator.clipboard.writeText(offer.discount_code);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get offer status
  const getOfferStatus = () => {
    if (!offer) return { label: "Unknown", color: "gray" };
    
    const now = new Date();
    const startDate = new Date(offer.start_date);
    const expiryDate = new Date(offer.expiry_date);

    if (now > expiryDate) {
      return { label: "Expired", color: "destructive" };
    }
    if (now < startDate) {
      return { label: "Upcoming", color: "yellow" };
    }
    if (offer.is_active) {
      return { label: "Active", color: "green" };
    }
    return { label: "Inactive", color: "gray" };
  };

  // Calculate remaining days
  const calculateRemainingDays = () => {
    if (!offer) return null;
    
    const now = new Date();
    const expiryDate = new Date(offer.expiry_date);
    
    // If already expired, return 0
    if (now > expiryDate) return 0;
    
    // Calculate difference in days
    const diffTime = Math.abs(expiryDate - now);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Calculate discounted price
  const calculateDiscountedPrice = () => {
    if (!offer || !offer.products) return null;
    
    const originalPrice = offer.products.price;
    const discountAmount = originalPrice * (offer.discount_percentage / 100);
    return originalPrice - discountAmount;
  };

  // Calculate savings
  const calculateSavings = () => {
    if (!offer || !offer.products) return null;
    
    const originalPrice = offer.products.price;
    return originalPrice * (offer.discount_percentage / 100);
  };

  // Status colors
  const statusColors = {
    green: "bg-green-100 text-green-800",
    yellow: "bg-yellow-100 text-yellow-800",
    destructive: "bg-red-100 text-red-800",
    gray: "bg-gray-100 text-gray-800",
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            className="mr-2 p-0 h-auto"
            onClick={() => router.push('/business/offers')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-40 w-full mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            className="mr-2 p-0 h-auto"
            onClick={() => router.push('/business/offers')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Offer Details</h1>
        </div>
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-5 w-5 mr-2" />
          <AlertDescription>
            <div>
              <h3 className="font-medium">Error loading offer</h3>
              <p>{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => router.push('/business/offers')}
              >
                Return to offers
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            className="mr-2 p-0 h-auto"
            onClick={() => router.push('/business/offers')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Offer Not Found</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="mb-4">The offer you are looking for could not be found.</p>
              <Button
                onClick={() => router.push('/business/offers')}
              >
                View All Offers
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = getOfferStatus();
  const remainingDays = calculateRemainingDays();
  const discountedPrice = calculateDiscountedPrice();
  const savings = calculateSavings();
  const claimPercentage = offer.max_claims 
    ? Math.round((offer.current_claims / offer.max_claims) * 100) 
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap justify-between items-center mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            className="mr-2 p-0 h-auto"
            onClick={() => router.push('/business/offers')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {offer.discount_percentage}% Off {offer.products?.name}
          </h1>
        </div>
        <div className="mt-2 flex space-x-2 sm:mt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/business/offers/${id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-800 hover:bg-red-50"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Offer Details</CardTitle>
                  <CardDescription>
                    Created on {formatDate(offer.created_at)}
                  </CardDescription>
                </div>
                <Badge className={statusColors[status.color]}>
                  {status.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Product
                  </h3>
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 mr-3">
                      <StorageImage
                        path={offer.products?.image_url}
                        alt={offer.products?.name}
                        className="w-full h-full object-cover"
                        fallbackSize="40x40"
                        emptyIcon={<Tag className="h-5 w-5 text-gray-300" />}
                      />
                    </div>
                    <div>
                      <p className="font-medium">
                        {offer.products?.name}
                      </p>
                      <Link 
                        href={`/business/products/${offer.product_id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View product
                      </Link>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Pricing
                  </h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Original Price:</span>
                      <span>{formatPrice(offer.products?.price)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Discount:</span>
                      <span>-{offer.discount_percentage}%</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Final Price:</span>
                      <span className="text-green-600">{formatPrice(discountedPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Customer Savings:</span>
                      <span>{formatPrice(savings)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Validity Period
                  </h3>
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span>Starts: {formatDate(offer.start_date)}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span>Expires: {formatDate(offer.expiry_date)}</span>
                    </div>
                    {status.color !== 'destructive' && (
                      <div className="flex items-center mt-2">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{remainingDays} days remaining</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Discount Code
                  </h3>
                  {offer.discount_code ? (
                    <div className="flex items-center">
                      <div className="font-mono bg-gray-100 px-2 py-1 rounded mr-2">
                        {offer.discount_code}
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={handleCopyCode}
                            >
                              {copySuccess ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4 text-gray-500" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{copySuccess ? 'Copied!' : 'Copy code'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ) : (
                    <p className="text-gray-600">No code required</p>
                  )}
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Offer Status</h3>
                    <p className="text-sm text-gray-500">
                      {status.color === 'green' ? (
                        'This offer is currently active and can be redeemed by customers.'
                      ) : status.color === 'yellow' ? (
                        'This offer is scheduled to start in the future.'
                      ) : status.color === 'destructive' ? (
                        'This offer has expired and can no longer be redeemed.'
                      ) : (
                        'This offer is inactive and cannot be redeemed by customers.'
                      )}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">
                      {offer.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <Switch
                      checked={offer.is_active}
                      onCheckedChange={handleToggleActive}
                      disabled={isToggling || status.color === 'destructive'}
                    />
                  </div>
                </div>

                {status.color === 'destructive' && (
                  <Alert>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <AlertDescription>
                      This offer has expired and cannot be activated.
                    </AlertDescription>
                  </Alert>
                )}

                {offer.max_claims !== null && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Usage Limits</h3>
                      <span className="text-sm text-gray-500">
                        {offer.current_claims} of {offer.max_claims} claims used
                      </span>
                    </div>
                    <Progress value={claimPercentage} className="h-2" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button 
                  variant="outline"
                  className="justify-start"
                  onClick={() => router.push(`/business/offers/${id}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Offer
                </Button>
                
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => router.push(`/business/offers/analytics?offerId=${id}`)}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
                
                <Button 
                  variant="outline" 
                  className="justify-start"
                  disabled
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Offer
                </Button>
                
                <Button 
                  variant="outline" 
                  className="justify-start text-red-600 hover:text-red-800 hover:bg-red-50"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete Offer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Offer Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-gray-100 rounded-md overflow-hidden mb-4">
                <StorageImage
                  path={offer.products?.image_url}
                  alt={offer.products?.name}
                  className="w-full h-full object-cover"
                  fallbackSize="300x300"
                  emptyIcon={<div className="flex items-center justify-center h-full text-gray-400">No image</div>}
                />
              </div>
              
              <h3 className="font-medium text-lg mb-1">{offer.products?.name}</h3>
              
              <div className="flex items-center space-x-2 mb-4">
                <Badge className={statusColors[status.color]}>
                  {status.label}
                </Badge>
                {status.color === 'green' && (
                  <Badge variant="outline" className="bg-white">
                    {remainingDays} days left
                  </Badge>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="text-3xl font-bold text-blue-600">
                    {offer.discount_percentage}% OFF
                  </div>
                  <div className="text-gray-500">
                    {formatPrice(offer.products?.price)} → <span className="text-green-600 font-medium">{formatPrice(discountedPrice)}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Validity:</span>
                    <span>{formatDate(offer.start_date)} - {formatDate(offer.expiry_date)}</span>
                  </div>
                  
                  {offer.discount_code && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Code:</span>
                      <span className="font-mono">{offer.discount_code}</span>
                    </div>
                  )}
                  
                  {offer.max_claims !== null && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Claims:</span>
                      <span>{offer.current_claims} of {offer.max_claims} ({claimPercentage}%)</span>
                    </div>
                  )}
                </div>
                
                <div className="pt-3">
                  <Button className="w-full" 
                    variant={status.color === 'destructive' ? 'outline' : 'default'}
                    disabled={status.color === 'destructive'}
                    onClick={() => router.push(`/business/offers/${id}/edit`)}
                  >
                    {status.color === 'destructive' ? 'Offer Expired' : 'Edit Offer'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Offer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this offer? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteOffer}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <span className="animate-spin mr-2">⋮</span>
                  Deleting...
                </>
              ) : "Delete Offer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}