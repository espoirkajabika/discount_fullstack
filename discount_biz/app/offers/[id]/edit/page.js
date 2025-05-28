'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react'; // Import the use function
import Link from 'next/link';
import { getOffer, updateOffer } from '@/lib/offers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  AlertCircle, 
  ArrowLeft, 
  Calendar, 
  Percent,
  Building2,
  Home,
  Package,
  Tag,
  DollarSign,
  Clock,
  Users,
  FileText,
  Save,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { StorageImage } from '@/components/ui/storage-image';
import { Badge } from '@/components/ui/badge';

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
              <span className="text-gray-900 font-medium">Edit</span>
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

export default function EditOfferPage({ params }) {
  // Use the React.use method to unwrap the params
  const id = use(params).id;

  const router = useRouter();

  const [originalOffer, setOriginalOffer] = useState(null);
  const [formData, setFormData] = useState({
    discount_percentage: '',
    discount_code: '',
    start_date: null,
    expiry_date: null,
    is_active: true,
    max_claims: '',
    has_max_claims: false,
  });

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch offer data
  useEffect(() => {
    const fetchOffer = async () => {
      setIsLoading(true);
      setError('');

      try {
        // Use the getOffer function from lib
        const result = await getOffer(id);
        
        if (result.error) {
          setError(result.error);
          return;
        }
        
        const offer = result.offer;
        setOriginalOffer(offer);

        // Set the product - handle both 'product' and 'products' keys
        setProduct(offer.product || offer.products);

        // Parse dates
        const startDate = new Date(offer.start_date);
        const expiryDate = new Date(offer.expiry_date);

        // Set form data - use discount_value from backend
        setFormData({
          discount_percentage: (offer.discount_value || offer.discount_percentage || 0).toString(),
          discount_code: offer.discount_code || '',
          start_date: startDate,
          expiry_date: expiryDate,
          is_active: offer.is_active,
          max_claims: offer.max_claims !== null ? offer.max_claims.toString() : '',
          has_max_claims: offer.max_claims !== null,
        });
      } catch (err) {
        console.error('Error fetching offer:', err);
        setError('Failed to fetch offer details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffer();
  }, [id]);

  // Handle text input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  // Handle discount percentage input (numbers only, max 100)
  const handleDiscountChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');

    if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 100)) {
      setFormData(prev => ({
        ...prev,
        discount_percentage: value
      }));
    }
    
    if (error) setError('');
  };

  // Handle max claims input (numbers only)
  const handleMaxClaimsChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setFormData(prev => ({
      ...prev,
      max_claims: value
    }));
  };

  // Handle date selection
  const handleDateSelect = (date, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
  };

  // Toggle max claims checkbox
  const handleMaxClaimsToggle = (checked) => {
    setFormData(prev => ({
      ...prev,
      has_max_claims: checked,
      max_claims: checked ? prev.max_claims || '' : null
    }));
  };

  // Toggle is_active switch
  const handleActiveToggle = (checked) => {
    setFormData(prev => ({
      ...prev,
      is_active: checked
    }));
  };

  // Get offer status
  const getOfferStatus = () => {
    if (!originalOffer) return { label: "Unknown", color: "gray" };

    const now = new Date();
    const startDate = new Date(originalOffer.start_date);
    const expiryDate = new Date(originalOffer.expiry_date);

    if (now > expiryDate) {
      return { label: "Expired", color: "destructive" };
    }
    if (now < startDate) {
      return { label: "Upcoming", color: "yellow" };
    }
    if (originalOffer.is_active) {
      return { label: "Active", color: "green" };
    }
    return { label: "Inactive", color: "gray" };
  };

  // Check if form has changes
  const hasChanges = () => {
    if (!originalOffer) return false;
    
    return (
      formData.discount_percentage !== (originalOffer.discount_value || originalOffer.discount_percentage || 0).toString() ||
      formData.discount_code !== (originalOffer.discount_code || '') ||
      formData.start_date?.toISOString() !== originalOffer.start_date ||
      formData.expiry_date?.toISOString() !== originalOffer.expiry_date ||
      formData.is_active !== originalOffer.is_active ||
      formData.has_max_claims !== (originalOffer.max_claims !== null) ||
      (formData.has_max_claims && formData.max_claims !== (originalOffer.max_claims?.toString() || ''))
    );
  };

  // Form validation
  const validateForm = () => {
    // Reset error
    setError('');

    if (!formData.discount_percentage) {
      setError('Please enter a discount percentage');
      return false;
    }

    if (!formData.start_date || !formData.expiry_date) {
      setError('Please select both start and expiry dates');
      return false;
    }

    // Validate date range
    if (new Date(formData.expiry_date) <= new Date(formData.start_date)) {
      setError('Expiry date must be after start date');
      return false;
    }

    // Validate max claims if enabled
    if (formData.has_max_claims && (!formData.max_claims || parseInt(formData.max_claims) < 1)) {
      setError('Please enter a valid number for maximum claims');
      return false;
    }

    // Ensure max claims is not less than current claims
    if (formData.has_max_claims && originalOffer &&
      parseInt(formData.max_claims) < originalOffer.current_claims) {
      setError(`Maximum claims cannot be less than current claims (${originalOffer.current_claims})`);
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data for API - only send changed fields
      const payload = {};

      if (formData.discount_percentage !== originalOffer?.discount_value?.toString()) {
        payload.discount_percentage = parseInt(formData.discount_percentage);
      }

      if (formData.discount_code !== (originalOffer?.discount_code || '')) {
        payload.discount_code = formData.discount_code || null;
      }

      if (formData.start_date?.toISOString() !== originalOffer?.start_date) {
        payload.start_date = formData.start_date.toISOString();
      }

      if (formData.expiry_date?.toISOString() !== originalOffer?.expiry_date) {
        payload.expiry_date = formData.expiry_date.toISOString();
      }

      if (formData.is_active !== originalOffer?.is_active) {
        payload.is_active = formData.is_active;
      }

      if (formData.has_max_claims !== (originalOffer?.max_claims !== null)) {
        payload.max_claims = formData.has_max_claims ? parseInt(formData.max_claims) : null;
      } else if (formData.has_max_claims && formData.max_claims !== originalOffer?.max_claims?.toString()) {
        payload.max_claims = parseInt(formData.max_claims);
      }

      console.log('Updating offer with payload:', payload);

      // Use the updateOffer function from lib
      const result = await updateOffer(id, payload);
      
      if (result.error) {
        setError(result.error);
        return;
      }

      // Redirect to the offer page
      router.push(`/offers/${id}`);
    } catch (err) {
      console.error('Error updating offer:', err);
      setError('Failed to update offer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Calculate discounted price
  const calculateDiscountedPrice = () => {
    if (!product || !formData.discount_percentage) {
      return null;
    }

    const originalPrice = product.price;
    const discountAmount = originalPrice * (parseInt(formData.discount_percentage) / 100);
    return originalPrice - discountAmount;
  };

  // Status colors
  const statusColors = {
    green: "bg-green-100 text-green-800 border-green-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    destructive: "bg-red-100 text-red-800 border-red-200",
    gray: "bg-gray-100 text-gray-800 border-gray-200",
  };

  // Loading state
  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader
          title="Edit Offer"
          subtitle="Loading offer information..."
          backUrl={`/offers/${id}`}
          backLabel="Back to Offer"
        />
        <ContentContainer>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-8 w-3/4 bg-gray-200 animate-pulse rounded"></div>
                    <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded"></div>
                    <div className="h-20 w-full bg-gray-200 animate-pulse rounded"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <div className="h-32 w-full bg-gray-200 animate-pulse rounded"></div>
                </CardContent>
              </Card>
            </div>
          </div>
        </ContentContainer>
      </PageContainer>
    );
  }

  // Error state
  if (error && isLoading) {
    return (
      <PageContainer>
        <PageHeader
          title="Edit Offer"
          subtitle="Unable to load offer information"
          backUrl={`/offers/${id}`}
          backLabel="Back to Offer"
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

  const status = getOfferStatus();
  const isExpired = status.color === 'destructive';

  return (
    <PageContainer>
      <PageHeader
        title="Edit Offer"
        subtitle="Update your offer details and settings"
        backUrl={`/offers/${id}`}
        backLabel="Back to Offer"
      >
        <div className="flex items-center gap-3">
          <Badge className={`${statusColors[status.color]} font-medium px-3 py-1`}>
            {status.label}
          </Badge>
          <Button
            variant="outline"
            onClick={() => router.push(`/offers/${id}`)}
            className="border-gray-200 hover:bg-gray-50"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Offer
          </Button>
        </div>
      </PageHeader>

      <ContentContainer>
        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {isExpired && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              This offer has expired. While you can still edit it, customers won't be able to redeem it unless you extend the expiry date.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form - Left Side */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Information */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg text-gray-900">
                    <Package className="h-5 w-5 mr-2 text-green-600" />
                    Product Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="h-12 w-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 mr-4">
                      <StorageImage
                        path={product?.image_url}
                        alt={product?.name}
                        className="w-full h-full object-cover"
                        fallbackSize="48x48"
                        emptyIcon={
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        }
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{product?.name}</p>
                      <p className="text-sm text-gray-500">{formatPrice(product?.price)}</p>
                    </div>
                    <Link
                      href={`/products/${product?.id}`}
                      className="text-sm text-green-600 hover:text-green-700 hover:underline font-medium"
                    >
                      View Product
                    </Link>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    The product cannot be changed. Create a new offer to use a different product.
                  </p>
                </CardContent>
              </Card>

              {/* Discount Settings */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg text-gray-900">
                    <Percent className="h-5 w-5 mr-2 text-green-600" />
                    Discount Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="discount_percentage" className="text-gray-700 font-semibold">
                        Discount Percentage *
                      </Label>
                      <div className="relative mt-2">
                        <Input
                          id="discount_percentage"
                          name="discount_percentage"
                          type="text"
                          value={formData.discount_percentage}
                          onChange={handleDiscountChange}
                          placeholder="10"
                          required
                          className="h-12 pr-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Percent className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Enter a value between 1-100
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="discount_code" className="text-gray-700 font-semibold">
                        Discount Code (Optional)
                      </Label>
                      <Input
                        id="discount_code"
                        name="discount_code"
                        type="text"
                        value={formData.discount_code}
                        onChange={handleChange}
                        placeholder="SUMMER2025"
                        className="mt-2 h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Leave blank if no code is required
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Offer Period */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg text-gray-900">
                    <Calendar className="h-5 w-5 mr-2 text-green-600" />
                    Offer Period
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date" className="text-gray-700 font-semibold">
                        Start Date *
                      </Label>
                      <div className="mt-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {formData.start_date ? (
                                format(formData.start_date, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={formData.start_date}
                              onSelect={(date) => handleDateSelect(date, 'start_date')}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="expiry_date" className="text-gray-700 font-semibold">
                        Expiry Date *
                      </Label>
                      <div className="mt-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {formData.expiry_date ? (
                                format(formData.expiry_date, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={formData.expiry_date}
                              onSelect={(date) => handleDateSelect(date, 'expiry_date')}
                              disabled={(date) =>
                                (formData.start_date && date < formData.start_date)
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Settings */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg text-gray-900">
                    <Users className="h-5 w-5 mr-2 text-green-600" />
                    Additional Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-3">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={handleActiveToggle}
                        disabled={isExpired}
                      />
                      <div>
                        <Label htmlFor="is_active" className="text-gray-700 font-semibold cursor-pointer">
                          Activate offer immediately
                        </Label>
                        <p className="text-xs text-gray-500">
                          Make this offer available to customers
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="has_max_claims"
                        checked={formData.has_max_claims}
                        onCheckedChange={handleMaxClaimsToggle}
                      />
                      <div>
                        <Label htmlFor="has_max_claims" className="text-gray-700 font-semibold cursor-pointer">
                          Limit maximum claims
                        </Label>
                        <p className="text-xs text-gray-500">
                          Set a maximum number of claims
                        </p>
                      </div>
                    </div>
                  </div>

                  {formData.has_max_claims && (
                    <div>
                      <Label htmlFor="max_claims" className="text-gray-700 font-semibold">
                        Maximum Claims
                      </Label>
                      <Input
                        id="max_claims"
                        name="max_claims"
                        type="text"
                        value={formData.max_claims}
                        onChange={handleMaxClaimsChange}
                        placeholder="100"
                        className="mt-2 h-12 max-w-xs bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
                      />

                      {originalOffer && originalOffer.current_claims > 0 && (
                        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <strong>Note:</strong> Currently {originalOffer.current_claims} claims have been used. 
                            New maximum must be greater than or equal to this amount.
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Enter the maximum number of times this offer can be claimed
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Preview Panel - Right Side */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Changes Indicator */}
                {hasChanges() && (
                  <Card className="border-0 shadow-lg bg-white border-yellow-200">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <p className="text-sm text-yellow-800 font-medium">
                          You have unsaved changes
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Offer Preview */}
                <Card className="border-0 shadow-lg bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg text-gray-900">
                      <Tag className="h-5 w-5 mr-2 text-green-600" />
                      Offer Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                        <StorageImage
                          path={product?.image_url}
                          alt={product?.name}
                          className="w-full h-full object-cover"
                          fallbackSize="300x300"
                          emptyIcon={
                            <div className="text-center">
                              <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">No image</p>
                            </div>
                          }
                        />
                      </div>

                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{product?.name}</h3>
                        
                        {formData.discount_percentage && (
                          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center justify-center">
                              <div className="bg-green-600 text-white px-3 py-1 rounded-full font-bold">
                                {formData.discount_percentage}% OFF
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Original price:</span>
                          <p className="font-medium text-gray-900">
                            {formatPrice(product?.price)}
                          </p>
                        </div>
                        {formData.discount_percentage && (
                          <div>
                            <span className="text-gray-500">Final price:</span>
                            <p className="font-bold text-green-600">
                              {formatPrice(calculateDiscountedPrice())}
                            </p>
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div className="space-y-3 text-sm">
                        {formData.discount_code && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Code:</span>
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                              {formData.discount_code}
                            </span>
                          </div>
                        )}

                        {formData.start_date && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Valid from:</span>
                            <span className="text-gray-900">
                              {format(formData.start_date, "MMM d, yyyy")}
                            </span>
                          </div>
                        )}

                        {formData.expiry_date && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Expires:</span>
                            <span className="text-gray-900">
                              {format(formData.expiry_date, "MMM d, yyyy")}
                            </span>
                          </div>
                        )}

                        {formData.has_max_claims && formData.max_claims && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Max claims:</span>
                            <span className="text-gray-900">{formData.max_claims}</span>
                          </div>
                        )}

                        <div className="flex justify-between">
                          <span className="text-gray-500">Status:</span>
                          <span className={formData.is_active ? "text-green-600 font-medium" : "text-gray-600"}>
                            {formData.is_active ? "Active" : "Inactive"}
                            {isExpired && (
                              <span className="text-red-500 block text-xs">
                                (Expired)
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing Breakdown */}
                {formData.discount_percentage && product && (
                  <Card className="border-0 shadow-lg bg-white">
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg text-gray-900">
                        <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                        Pricing Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Original Price</span>
                          <span className="text-gray-900 line-through">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Discount ({formData.discount_percentage}%)</span>
                          <span className="text-red-600 font-medium">
                            -{formatPrice((product.price * parseInt(formData.discount_percentage)) / 100)}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-gray-900 font-semibold">Customer Pays</span>
                          <span className="text-xl font-bold text-green-600">
                            {formatPrice(calculateDiscountedPrice())}
                          </span>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                          <p className="text-sm text-green-800">
                            <strong>Customer saves {formatPrice((product.price * parseInt(formData.discount_percentage)) / 100)}</strong>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !formData.discount_percentage || !formData.start_date || !formData.expiry_date || !hasChanges()}
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Saving...</span>
                      </div>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/offers/${id}`)}
                    disabled={isSubmitting}
                    className="w-full h-12 border-gray-200 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </ContentContainer>
    </PageContainer>
  );
}