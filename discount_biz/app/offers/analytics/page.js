'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, ArrowLeft, Calendar, Percent } from 'lucide-react';
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

export default function EditOfferPage({ params }) {
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
        const response = await fetch(`/api/business/offers/${id}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch offer details');
        }

        const data = await response.json();
        const offer = data.offer;
        setOriginalOffer(offer);
        
        // Set the product
        setProduct(offer.products);
        
        // Parse dates
        const startDate = new Date(offer.start_date);
        const expiryDate = new Date(offer.expiry_date);
        
        // Set form data
        setFormData({
          discount_percentage: offer.discount_percentage.toString(),
          discount_code: offer.discount_code || '',
          start_date: startDate,
          expiry_date: expiryDate,
          is_active: offer.is_active,
          max_claims: offer.max_claims !== null ? offer.max_claims.toString() : '',
          has_max_claims: offer.max_claims !== null,
        });
      } catch (err) {
        console.error('Error fetching offer:', err);
        setError(err.message);
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
      max_claims: checked ? prev.max_claims : null
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
    if (formData.has_max_claims && 
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
      // Prepare data for API
      const payload = {
        discount_percentage: parseInt(formData.discount_percentage),
        discount_code: formData.discount_code || null,
        start_date: formData.start_date.toISOString(),
        expiry_date: formData.expiry_date.toISOString(),
        is_active: formData.is_active,
        max_claims: formData.has_max_claims ? parseInt(formData.max_claims) : null
      };
      
      const response = await fetch(`/api/business/offers/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update offer');
      }
      
      // Redirect to the offer page
      router.push(`/business/offers/${id}`);
    } catch (err) {
      console.error('Error updating offer:', err);
      setError(err.message);
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
    green: "bg-green-100 text-green-800",
    yellow: "bg-yellow-100 text-yellow-800",
    destructive: "bg-red-100 text-red-800",
    gray: "bg-gray-100 text-gray-800",
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            className="mr-2 p-0 h-auto"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Edit Offer</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            className="mr-2 p-0 h-auto"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Edit Offer</h1>
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

  const status = getOfferStatus();
  const isExpired = status.color === 'destructive';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-2 p-0 h-auto"
          onClick={() => router.push(`/business/offers/${id}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Edit Offer</h1>
        <Badge className={`ml-3 ${statusColors[status.color]}`}>
          {status.label}
        </Badge>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isExpired && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>
            This offer has expired. While you can still edit it, customers won't be able to redeem it unless you extend the expiry date.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Offer Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label>Product</Label>
                    <div className="flex items-center mt-1 p-3 border rounded-md bg-gray-50">
                      <div className="h-10 w-10 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 mr-3">
                        <StorageImage
                          path={product?.image_url}
                          alt={product?.name}
                          className="w-full h-full object-cover"
                          fallbackSize="40x40"
                          emptyIcon={<p className="text-gray-400 text-xs">No image</p>}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{product?.name}</p>
                        <p className="text-sm text-gray-500">{formatPrice(product?.price)}</p>
                      </div>
                      <Link 
                        href={`/business/products/${product?.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View product
                      </Link>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      The product cannot be changed. Create a new offer to use a different product.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="discount_percentage" className="required">Discount Percentage</Label>
                      <div className="relative mt-1">
                        <Input
                          id="discount_percentage"
                          name="discount_percentage"
                          type="text"
                          value={formData.discount_percentage}
                          onChange={handleDiscountChange}
                          placeholder="10"
                          required
                          className="pr-9"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <Percent className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Enter a value between 1-100
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="discount_code">Discount Code (Optional)</Label>
                      <Input
                        id="discount_code"
                        name="discount_code"
                        type="text"
                        value={formData.discount_code}
                        onChange={handleChange}
                        placeholder="SUMMER2025"
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Leave blank if no code is required
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date" className="required">Start Date</Label>
                      <div className="mt-1">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
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
                      <Label htmlFor="expiry_date" className="required">Expiry Date</Label>
                      <div className="mt-1">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2 mt-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={handleActiveToggle}
                        disabled={isExpired}
                      />
                      <Label htmlFor="is_active" className="cursor-pointer">
                        Activate offer immediately
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 mt-2">
                      <Checkbox
                        id="has_max_claims"
                        checked={formData.has_max_claims}
                        onCheckedChange={handleMaxClaimsToggle}
                      />
                      <Label htmlFor="has_max_claims" className="cursor-pointer">
                        Limit maximum claims
                      </Label>
                    </div>
                  </div>

                  {formData.has_max_claims && (
                    <div>
                      <Label htmlFor="max_claims">Maximum Claims</Label>
                      <Input
                        id="max_claims"
                        name="max_claims"
                        type="text"
                        value={formData.max_claims}
                        onChange={handleMaxClaimsChange}
                        placeholder="100"
                        className="mt-1 max-w-[200px]"
                      />
                      
                      {originalOffer && originalOffer.current_claims > 0 && (
                        <p className="text-xs text-amber-600 mt-1">
                          Currently {originalOffer.current_claims} claims used. 
                          New maximum must be greater than or equal to this amount.
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Enter the maximum number of times this offer can be claimed
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push(`/business/offers/${id}`)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="animate-spin mr-2">⋮</span>
                          Saving...
                        </>
                      ) : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Offer Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <div className="aspect-square bg-gray-100 rounded-md overflow-hidden mb-4">
                  <StorageImage
                    path={product?.image_url}
                    alt={product?.name}
                    className="w-full h-full object-cover"
                    fallbackSize="300x300"
                    emptyIcon={<p className="flex items-center justify-center h-full text-gray-400">No image</p>}
                  />
                </div>
                
                <h3 className="font-medium text-lg">{product?.name}</h3>
                
                <div className="mt-3 grid grid-cols-2 gap-1">
                  <div className="text-gray-500">Original price:</div>
                  <div className="text-right">{formatPrice(product?.price)}</div>
                  
                  {formData.discount_percentage && (
                    <>
                      <div className="text-gray-500">Discount:</div>
                      <div className="text-right text-red-600">-{formData.discount_percentage}%</div>
                      
                      <div className="text-gray-500 font-medium">Final price:</div>
                      <div className="text-right font-bold text-green-600">
                        {formatPrice(calculateDiscountedPrice())}
                      </div>
                    </>
                  )}
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-2 text-sm">
                  {formData.discount_code && (
                    <div>
                      <span className="text-gray-500">Code: </span>
                      <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">
                        {formData.discount_code}
                      </span>
                    </div>
                  )}
                  
                  {formData.start_date && (
                    <div>
                      <span className="text-gray-500">Valid from: </span>
                      {format(formData.start_date, "PPP")}
                    </div>
                  )}
                  
                  {formData.expiry_date && (
                    <div>
                      <span className="text-gray-500">Expires: </span>
                      {format(formData.expiry_date, "PPP")}
                    </div>
                  )}
                  
                  {formData.has_max_claims && formData.max_claims && (
                    <div>
                      <span className="text-gray-500">Limited to: </span>
                      {formData.max_claims} claims
                    </div>
                  )}
                  
                  <div>
                    <span className="text-gray-500">Status: </span>
                    <span className={formData.is_active ? "text-green-600" : "text-gray-600"}>
                      {formData.is_active ? "Active" : "Inactive"}
                    </span>
                    {isExpired && (
                      <span className="text-red-500 block">
                        (Expired)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}