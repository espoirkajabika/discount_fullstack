'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { createOffer } from '@/lib/offers';
import { getProducts } from '@/lib/products'; 


export default function NewOfferPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedProductId = searchParams.get('productId');

  const [formData, setFormData] = useState({
    product_id: preSelectedProductId || '',
    discount_percentage: '',
    discount_code: '',
    start_date: new Date(), // Default to today
    expiry_date: '', // Will be set to 30 days from now
    is_active: true,
    max_claims: '',
    has_max_claims: false, // UI helper, not sent to API
  });

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [error, setError] = useState('');

  // Set default expiry date to 30 days from start date
  useEffect(() => {
    if (formData.start_date) {
      const thirtyDaysLater = new Date(formData.start_date);
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
      setFormData(prev => ({
        ...prev,
        expiry_date: thirtyDaysLater
      }));
    }
  }, []);

  // Fetch products for dropdown

  useEffect(() => {
    const fetchProducts = async () => {
      setIsProductsLoading(true);
      try {
        const result = await getProducts({ limit: 100 });

        if (result.error) {
          throw new Error(result.error);
        }

        const products = result.products || [];
        setProducts(products);

        // If a product ID was provided in the URL, select that product
        if (preSelectedProductId) {
          const selectedProduct = products.find(p => p.id === preSelectedProductId);
          if (selectedProduct) {
            setSelectedProduct(selectedProduct);
          }
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setIsProductsLoading(false);
      }
    };

    fetchProducts();
  }, [preSelectedProductId]);

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

  // Handle product selection
  const handleProductSelect = (productId) => {
    setFormData(prev => ({
      ...prev,
      product_id: productId
    }));

    const product = products.find(p => p.id === productId);
    setSelectedProduct(product);
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

  // Form validation
  const validateForm = () => {
    // Reset error
    setError('');

    // Required fields
    if (!formData.product_id) {
      setError('Please select a product');
      return false;
    }

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

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }
  
  setIsLoading(true);
  
  try {
    const offerData = {
      product_id: formData.product_id,
      discount_percentage: parseInt(formData.discount_percentage),
      discount_code: formData.discount_code || null,
      start_date: formData.start_date.toISOString(),
      expiry_date: formData.expiry_date.toISOString(),
      is_active: formData.is_active,
      max_claims: formData.has_max_claims ? parseInt(formData.max_claims) : null,
      title: `${formData.discount_percentage}% Off ${selectedProduct?.name || 'Product'}`,
      description: `Get ${formData.discount_percentage}% off ${selectedProduct?.name || 'this product'}!`,
      terms_conditions: "Standard terms and conditions apply"
    };
    
    const result = await createOffer(offerData);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    // Redirect to the offer page
    router.push(`/offers/${result.offer.id}`);
  } catch (err) {
    console.error('Error creating offer:', err);
    setError(err.message);
  } finally {
    setIsLoading(false);
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
    if (!selectedProduct || !formData.discount_percentage) {
      return null;
    }

    const originalPrice = selectedProduct.price;
    const discountAmount = originalPrice * (parseInt(formData.discount_percentage) / 100);
    return originalPrice - discountAmount;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          className="mr-2 p-0 h-auto"
          onClick={() => router.push('/offers')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Create New Offer</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
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
                    <Label htmlFor="product_id" className="required">Select Product</Label>
                    <Select
                      value={formData.product_id}
                      onValueChange={handleProductSelect}
                      disabled={isProductsLoading}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {isProductsLoading ? (
                          <div className="flex items-center justify-center p-2">
                            <span className="animate-spin mr-2">⋮</span>
                            Loading products...
                          </div>
                        ) : products.length === 0 ? (
                          <div className="p-2 text-center">
                            No products found. <Link href="/products/new" className="text-blue-600">Add a product</Link>
                          </div>
                        ) : (
                          products.map(product => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - {formatPrice(product.price)}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
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
                        Leave blank to generate automatically
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
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
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
                                date < new Date(new Date().setHours(0, 0, 0, 0)) ||
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
                      <p className="text-xs text-gray-500 mt-1">
                        Enter the maximum number of times this offer can be claimed
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/offers')}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="animate-spin mr-2">⋮</span>
                          Creating...
                        </>
                      ) : 'Create Offer'}
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
              {selectedProduct ? (
                <div>
                  <div className="aspect-square bg-gray-100 rounded-md overflow-hidden mb-4">
                    <StorageImage
                      path={selectedProduct.image_url}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                      fallbackSize="300x300"
                      emptyIcon={<p className="flex items-center justify-center h-full text-gray-400">No image</p>}
                    />
                  </div>

                  <h3 className="font-medium text-lg">{selectedProduct.name}</h3>

                  <div className="mt-3 grid grid-cols-2 gap-1">
                    <div className="text-gray-500">Original price:</div>
                    <div className="text-right">{formatPrice(selectedProduct.price)}</div>

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
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>Select a product to see the offer preview</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}