'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getOffer, updateOfferStatus, deleteOffer } from '@/lib/offers';
import { useAuth } from '@/context/AuthContext';
import { BusinessRoute } from '@/components/ProtectedRoute';

// Import components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Edit,
  Home,
  MoreVertical,
  Package,
  Pause,
  Percent,
  Play,
  Tag,
  TrendingUp,
  Users,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  ExternalLink,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Share2
} from 'lucide-react';
import { StorageImage } from '@/components/ui/storage-image';

// Page components
function PageContainer({ children, className = "" }) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 ${className}`}>
      {children}
    </div>
  );
}

function PageHeader({ 
  title, 
  subtitle, 
  backButton = true, 
  backUrl = null,
  backLabel = "Back",
  children 
}) {
  const router = useRouter();

  const handleBack = () => {
    if (backUrl) {
      router.push(backUrl);
    } else {
      router.back();
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top navigation bar with logo */}
        <div className="flex items-center justify-between h-16 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            
            {/* Breadcrumbs */}
            <nav className="flex items-center space-x-2 text-sm">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </button>
              <span className="text-gray-400">/</span>
              <button
                onClick={() => router.push('/offers')}
                className="text-gray-500 hover:text-green-600 transition-colors"
              >
                Offers
              </button>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium">Details</span>
            </nav>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-green-600"
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>

        {/* Page header */}
        <div className="py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              {backButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="flex-shrink-0 -ml-2 text-gray-600 hover:text-green-600"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  {backLabel}
                </Button>
              )}
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && (
                  <p className="text-gray-600 mt-1">{subtitle}</p>
                )}
              </div>
            </div>

            {children && (
              <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
                {children}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContentContainer({ children, className = "" }) {
  return (
    <div className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
      {children}
    </div>
  );
}

function OfferDetailsContent() {
  const router = useRouter();
  const params = useParams();
  const offerId = params.id;
  
  const [offer, setOffer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load offer details
  useEffect(() => {
    if (offerId) {
      loadOfferDetails();
    }
  }, [offerId]);

  const loadOfferDetails = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await getOffer(offerId);
      if (result.error) {
        setError(result.error);
      } else {
        setOffer(result.offer);
      }
    } catch (err) {
      console.error('Error loading offer:', err);
      setError('Failed to load offer details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format relative time
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return date < now ? 'Yesterday' : 'Tomorrow';
    } else if (diffDays <= 7) {
      return `${diffDays} days ${date < now ? 'ago' : 'from now'}`;
    } else {
      return formatDate(dateString);
    }
  };

  // Get offer status
  const getOfferStatus = (offer) => {
    const now = new Date();
    const startDate = new Date(offer.start_date);
    const expiryDate = new Date(offer.expiry_date);

    if (now > expiryDate) {
      return { label: "Expired", color: "destructive", icon: XCircle };
    }
    if (now < startDate) {
      return { label: "Upcoming", color: "yellow", icon: Clock };
    }
    if (offer.is_active) {
      return { label: "Active", color: "green", icon: CheckCircle };
    }
    return { label: "Inactive", color: "gray", icon: Pause };
  };

  // Status colors
  const statusColors = {
    green: "bg-green-100 text-green-800 border-green-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    destructive: "bg-red-100 text-red-800 border-red-200",
    gray: "bg-gray-100 text-gray-800 border-gray-200",
  };

  // Handle status toggle
  const handleStatusToggle = async () => {
    setIsUpdating(true);
    try {
      const newStatus = !offer.is_active;
      const result = await updateOfferStatus(offerId, { is_active: newStatus });
      
      if (result.error) {
        setError(result.error);
      } else {
        setOffer(prev => ({ ...prev, is_active: newStatus }));
      }
    } catch (err) {
      console.error('Error updating offer status:', err);
      setError('Failed to update offer status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete offer
  const handleDeleteOffer = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteOffer(offerId);
      
      if (result.error) {
        setError(result.error);
      } else {
        router.push('/offers');
      }
    } catch (err) {
      console.error('Error deleting offer:', err);
      setError('Failed to delete offer. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Copy offer ID to clipboard
  const copyOfferId = async () => {
    try {
      await navigator.clipboard.writeText(offerId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Share offer
  const shareOffer = async () => {
    const shareData = {
      title: `${offer.product?.name || 'Special Offer'} - ${offer.discount_value}% Off`,
      text: `Check out this amazing ${offer.discount_value}% discount!`,
      url: `${window.location.origin}/public/offers/${offerId}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback to copying URL
      try {
        await navigator.clipboard.writeText(shareData.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy URL:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader
          title="Offer Details"
          subtitle="Loading offer information..."
          backUrl="/offers"
          backLabel="Back to Offers"
        />
        <ContentContainer>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-20 w-full" />
                    <div className="grid grid-cols-3 gap-4">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </ContentContainer>
      </PageContainer>
    );
  }

  if (error && !offer) {
    return (
      <PageContainer>
        <PageHeader
          title="Offer Details"
          subtitle="Unable to load offer information"
          backUrl="/offers"
          backLabel="Back to Offers"
        />
        <ContentContainer>
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        </ContentContainer>
      </PageContainer>
    );
  }

  if (!offer) {
    return (
      <PageContainer>
        <PageHeader
          title="Offer Not Found"
          subtitle="The requested offer could not be found"
          backUrl="/offers"
          backLabel="Back to Offers"
        />
        <ContentContainer>
          <div className="text-center py-16">
            <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Offer Not Found</h3>
            <p className="text-gray-600 mb-8">
              The offer you're looking for doesn't exist or may have been deleted.
            </p>
            <Button 
              onClick={() => router.push('/offers')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Back to Offers
            </Button>
          </div>
        </ContentContainer>
      </PageContainer>
    );
  }

  const status = getOfferStatus(offer);
  const StatusIcon = status.icon;
  const product = offer.product || offer.products;
  const originalPrice = parseFloat(product?.price) || 0;
  const discountPercent = parseFloat(offer.discount_value) || 0;
  const discountAmount = (originalPrice * discountPercent) / 100;
  const finalPrice = originalPrice - discountAmount;

  // Calculate days remaining
  const daysRemaining = () => {
    const now = new Date();
    const expiryDate = new Date(offer.expiry_date);
    const timeDiff = expiryDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff;
  };

  const remainingDays = daysRemaining();

  return (
    <PageContainer>
      <PageHeader
        title={product?.name || "Offer Details"}
        subtitle={`${discountPercent}% discount offer`}
        backUrl="/offers"
        backLabel="Back to Offers"
      >
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/offers/${offerId}/edit`)}
            className="border-gray-200 hover:bg-gray-50"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Offer
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-gray-200">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleStatusToggle} disabled={isUpdating}>
                {offer.is_active ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Deactivate Offer
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Activate Offer
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyOfferId}>
                <Copy className="h-4 w-4 mr-2" />
                {copied ? 'Copied!' : 'Copy Offer ID'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={shareOffer}>
                <Share2 className="h-4 w-4 mr-2" />
                Share Offer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(`/public/offers/${offerId}`, '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Public Page
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Offer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </PageHeader>

      <ContentContainer>
        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Offer Overview */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-xl text-gray-900">
                    <Tag className="h-5 w-5 mr-2 text-green-600" />
                    Offer Overview
                  </CardTitle>
                  <Badge className={`${statusColors[status.color]} font-medium px-3 py-1`}>
                    <StatusIcon className="h-4 w-4 mr-1" />
                    {status.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                    <StorageImage
                      path={product?.image_url}
                      alt={product?.name}
                      className="w-full h-full object-cover"
                      fallbackSize="80x80"
                      emptyIcon={
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-300" />
                        </div>
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {product?.name || 'Unknown Product'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {product?.description || 'No description available'}
                    </p>
                    <div className="flex items-center space-x-4">
                      <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold">
                        <Percent className="h-4 w-4 inline mr-1" />
                        {discountPercent}% OFF
                      </div>
                      <span className="text-sm text-gray-500">
                        Created {formatRelativeTime(offer.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pricing Details */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Pricing Details</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Original Price</p>
                      <p className="text-lg font-semibold text-gray-900 line-through">
                        {formatPrice(originalPrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">You Save</p>
                      <p className="text-lg font-semibold text-red-600">
                        -{formatPrice(discountAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Final Price</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatPrice(finalPrice)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Offer Period */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-green-600" />
                      Offer Period
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Start Date</span>
                        <span className="text-gray-900 font-medium">
                          {formatDate(offer.start_date)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">End Date</span>
                        <span className="text-gray-900 font-medium">
                          {formatDate(offer.expiry_date)}
                        </span>
                      </div>
                      {remainingDays > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Days Remaining</span>
                          <span className={`font-medium ${remainingDays <= 3 ? 'text-red-600' : 'text-green-600'}`}>
                            {remainingDays} {remainingDays === 1 ? 'day' : 'days'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Users className="h-4 w-4 mr-2 text-green-600" />
                      Usage Statistics
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Claims</span>
                        <span className="text-gray-900 font-medium">
                          {offer.current_claims || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Maximum Claims</span>
                        <span className="text-gray-900 font-medium">
                          {offer.max_claims || 'Unlimited'}
                        </span>
                      </div>
                      {offer.max_claims && (
                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{Math.round((offer.current_claims / offer.max_claims) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min((offer.current_claims / offer.max_claims) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Terms & Conditions */}
            {offer.terms_conditions && (
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg text-gray-900">
                    <FileText className="h-5 w-5 mr-2 text-green-600" />
                    Terms & Conditions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {offer.terms_conditions}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Activity Log (Future Feature) */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="flex items-center text-lg text-gray-900">
                  <Clock className="h-5 w-5 mr-2 text-green-600" />
                  Activity Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm text-gray-900 font-medium">Offer created</p>
                      <p className="text-xs text-gray-500">{formatRelativeTime(offer.created_at)}</p>
                    </div>
                  </div>
                  {offer.updated_at && offer.updated_at !== offer.created_at && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm text-gray-900 font-medium">Offer updated</p>
                        <p className="text-xs text-gray-500">{formatRelativeTime(offer.updated_at)}</p>
                      </div>
                    </div>
                  )}
                  {offer.current_claims > 0 && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm text-gray-900 font-medium">
                          {offer.current_claims} claim{offer.current_claims !== 1 ? 's' : ''} made
                        </p>
                        <p className="text-xs text-gray-500">By customers</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleStatusToggle}
                  disabled={isUpdating}
                  className={`w-full h-10 ${
                    offer.is_active 
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isUpdating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  ) : offer.is_active ? (
                    <Pause className="h-4 w-4 mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  {offer.is_active ? 'Pause Offer' : 'Activate Offer'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => router.push(`/offers/${offerId}/edit`)}
                  className="w-full h-10 border-gray-200 hover:bg-gray-50"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Offer
                </Button>
                
                <Button
                  variant="outline"
                  onClick={shareOffer}
                  className="w-full h-10 border-gray-200 hover:bg-gray-50"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Offer
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => window.open(`/public/offers/${offerId}`, '_blank')}
                  className="w-full h-10 border-gray-200 hover:bg-gray-50"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Public Page
                </Button>
              </CardContent>
            </Card>

            {/* Offer Information */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">Offer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div>
                    <span className="text-gray-500">Offer ID</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-gray-900 font-mono text-xs">
                        {offerId.slice(0, 8)}...
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={copyOfferId}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <span className="text-gray-500">Status</span>
                    <div className="mt-1">
                      <Badge className={`${statusColors[status.color]} text-xs`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-500">Category</span>
                    <p className="text-gray-900 mt-1">
                      {product?.category?.name || 'Uncategorized'}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-gray-500">Created</span>
                    <p className="text-gray-900 mt-1">
                      {new Date(offer.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-gray-500">Last Updated</span>
                    <p className="text-gray-900 mt-1">
                      {new Date(offer.updated_at || offer.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="flex items-center text-lg text-gray-900">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {offer.current_claims || 0}
                    </div>
                    <p className="text-sm text-green-800">Total Claims</p>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatPrice((offer.current_claims || 0) * discountAmount)}
                    </div>
                    <p className="text-sm text-blue-800">Customer Savings</p>
                  </div>
                  
                  {offer.max_claims && (
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {Math.max(0, offer.max_claims - offer.current_claims)}
                      </div>
                      <p className="text-sm text-yellow-800">Claims Remaining</p>
                    </div>
                  )}

                  {remainingDays > 0 && (
                    <div className={`text-center p-4 rounded-lg ${
                      remainingDays <= 3 ? 'bg-red-50' : 'bg-gray-50'
                    }`}>
                      <div className={`text-2xl font-bold ${
                        remainingDays <= 3 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {remainingDays}
                      </div>
                      <p className={`text-sm ${
                        remainingDays <= 3 ? 'text-red-800' : 'text-gray-800'
                      }`}>
                        Days Remaining
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-0 shadow-lg bg-white border-red-100">
              <CardHeader>
                <CardTitle className="flex items-center text-lg text-red-600">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Once you delete an offer, there is no going back. Please be certain.
                </p>
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Offer
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center text-red-600">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        Delete Offer
                      </DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete this offer? This action cannot be undone.
                        All data associated with this offer will be permanently removed.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="bg-gray-50 rounded-lg p-4 my-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        {product?.name || 'Unknown Product'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {discountPercent}% discount • {offer.current_claims || 0} claims made
                      </p>
                    </div>
                    <DialogFooter className="sm:justify-start">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowDeleteDialog(false)}
                        disabled={isDeleting}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDeleteOffer}
                        disabled={isDeleting}
                        className="flex-1"
                      >
                        {isDeleting ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                            Deleting...
                          </div>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Offer
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </ContentContainer>
    </PageContainer>
  );
}

export default function OfferDetailsPage() {
  return (
    <BusinessRoute>
      <OfferDetailsContent />
    </BusinessRoute>
  );
}