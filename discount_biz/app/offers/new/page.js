'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createOffer } from '@/lib/offers';
import { getProducts } from '@/lib/products';
import { useAuth } from '@/context/AuthContext';
import { BusinessRoute } from '@/components/ProtectedRoute';

// Import components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  Home,
  Package,
  Percent,
  Save,
  Tag,
  DollarSign,
  Clock,
  Users,
  FileText
} from 'lucide-react';

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
              <span className="text-gray-900 font-medium">Create New</span>
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
    <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
      {children}
    </div>
  );
}

function CreateOfferContent() {
  const router = useRouter();
  const { user } = useAuth();
  
  // State for form data
  const [formData, setFormData] = useState({
    product_id: '',
    discount_percentage: '',
    discount_code: '',
    start_date: '',
    expiry_date: '',
    max_claims: '',
    is_active: true,
    terms_conditions: ''
  });
  
  // State for products and UI
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Load user's products
  const loadProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const result = await getProducts({ limit: 100 }); // Get all products
      if (result.error) {
        setError(result.error);
      } else {
        setProducts(result.products || []);
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  // Handle product selection
  const handleProductSelect = (productId) => {
    const product = products.find(p => p.id === productId);
    setSelectedProduct(product);
    handleInputChange('product_id', productId);
  };

  // Calculate pricing preview
  const calculatePricing = () => {
    if (!selectedProduct || !formData.discount_percentage) {
      return null;
    }
    
    const originalPrice = parseFloat(selectedProduct.price) || 0;
    const discountPercent = parseFloat(formData.discount_percentage) || 0;
    const discountAmount = (originalPrice * discountPercent) / 100;
    const finalPrice = originalPrice - discountAmount;
    
    return {
      originalPrice,
      discountAmount,
      finalPrice,
      discountPercent
    };
  };

  // Format currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Get date one week from today
  const getNextWeekDate = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  };

  // Validate form
  const validateForm = () => {
    if (!formData.product_id) {
      setError('Please select a product for this offer.');
      return false;
    }
    
    if (!formData.discount_percentage || formData.discount_percentage <= 0 || formData.discount_percentage > 100) {
      setError('Please enter a valid discount percentage between 1 and 100.');
      return false;
    }
    
    if (!formData.start_date) {
      setError('Please select a start date for the offer.');
      return false;
    }
    
    if (!formData.expiry_date) {
      setError('Please select an expiry date for the offer.');
      return false;
    }
    
    if (new Date(formData.start_date) >= new Date(formData.expiry_date)) {
      setError('Expiry date must be after the start date.');
      return false;
    }
    
    if (formData.max_claims && (formData.max_claims <= 0 || formData.max_claims > 10000)) {
      setError('Maximum claims must be between 1 and 10,000.');
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
    setError('');
    
    try {
      // Prepare data for API
      const offerData = {
        product_id: formData.product_id,
        discount_percentage: parseFloat(formData.discount_percentage),
        start_date: formData.start_date + 'T00:00:00Z',
        expiry_date: formData.expiry_date + 'T23:59:59Z',
        is_active: formData.is_active,
        max_claims: formData.max_claims ? parseInt(formData.max_claims) : null,
        terms_conditions: formData.terms_conditions || null
      };
      
      console.log('Creating offer with data:', offerData);
      
      const result = await createOffer(offerData);
      
      if (result.error) {
        setError(result.error);
        return;
      }
      
      // Success - redirect to offers page
      router.push('/offers');
    } catch (err) {
      console.error('Error creating offer:', err);
      setError('Failed to create offer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize dates
  useEffect(() => {
    if (!formData.start_date) {
      setFormData(prev => ({
        ...prev,
        start_date: getTodayDate(),
        expiry_date: getNextWeekDate()
      }));
    }
  }, []);

  const pricing = calculatePricing();

  return (
    <PageContainer>
      <PageHeader
        title="Create New Offer"
        subtitle="Set up a special discount for your customers"
        backUrl="/offers"
        backLabel="Back to Offers"
      />

      <ContentContainer>
        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form - Left Side */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Selection */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg text-gray-900">
                    <Package className="h-5 w-5 mr-2 text-green-600" />
                    Product Selection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="product" className="text-gray-700 font-semibold">
                      Choose Product *
                    </Label>
                    <Select 
                      value={formData.product_id} 
                      onValueChange={handleProductSelect}
                      disabled={isLoadingProducts}
                    >
                      <SelectTrigger className="mt-2 h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500">
                        <SelectValue placeholder={isLoadingProducts ? "Loading products..." : "Select a product"} />
                      </SelectTrigger>
                      <SelectContent>
                        {products.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p>No products available</p>
                            <Button 
                              size="sm" 
                              className="mt-2"
                              onClick={() => router.push('/products/new')}
                            >
                              Add Product
                            </Button>
                          </div>
                        ) : (
                          products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                  <Package className="h-4 w-4 text-gray-400" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">{product.name}</p>
                                  <p className="text-sm text-gray-500">{formatPrice(product.price)}</p>
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedProduct && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{selectedProduct.name}</h4>
                          <p className="text-sm text-gray-600">{selectedProduct.description || 'No description'}</p>
                          <p className="text-lg font-bold text-green-600">{formatPrice(selectedProduct.price)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Discount Details */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg text-gray-900">
                    <Percent className="h-5 w-5 mr-2 text-green-600" />
                    Discount Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="discount_percentage" className="text-gray-700 font-semibold">
                      Discount Percentage *
                    </Label>
                    <div className="relative mt-2">
                      <Input
                        id="discount_percentage"
                        type="number"
                        min="1"
                        max="100"
                        step="0.01"
                        value={formData.discount_percentage}
                        onChange={(e) => handleInputChange('discount_percentage', e.target.value)}
                        placeholder="Enter discount percentage"
                        className="h-12 pr-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Percent className="h-4 w-4 text-gray-400" />
                      </div>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date" className="text-gray-700 font-semibold">
                        Start Date *
                      </Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => handleInputChange('start_date', e.target.value)}
                        min={getTodayDate()}
                        className="mt-2 h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="expiry_date" className="text-gray-700 font-semibold">
                        Expiry Date *
                      </Label>
                      <Input
                        id="expiry_date"
                        type="date"
                        value={formData.expiry_date}
                        onChange={(e) => handleInputChange('expiry_date', e.target.value)}
                        min={formData.start_date || getTodayDate()}
                        className="mt-2 h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
                      />
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
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="max_claims" className="text-gray-700 font-semibold">
                      Maximum Claims (Optional)
                    </Label>
                    <Input
                      id="max_claims"
                      type="number"
                      min="1"
                      max="10000"
                      value={formData.max_claims}
                      onChange={(e) => handleInputChange('max_claims', e.target.value)}
                      placeholder="Leave empty for unlimited"
                      className="mt-2 h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Limit how many customers can claim this offer
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="terms_conditions" className="text-gray-700 font-semibold">
                      Terms & Conditions (Optional)
                    </Label>
                    <Textarea
                      id="terms_conditions"
                      value={formData.terms_conditions}
                      onChange={(e) => handleInputChange('terms_conditions', e.target.value)}
                      placeholder="Enter any terms and conditions for this offer..."
                      rows={4}
                      className="mt-2 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500 resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview Panel - Right Side */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Pricing Preview */}
                {pricing && (
                  <Card className="border-0 shadow-lg bg-white">
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg text-gray-900">
                        <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                        Pricing Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Original Price</span>
                          <span className="text-gray-900 line-through">
                            {formatPrice(pricing.originalPrice)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Discount ({pricing.discountPercent}%)</span>
                          <span className="text-red-600 font-medium">
                            -{formatPrice(pricing.discountAmount)}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                          <span className="text-gray-900 font-semibold">Final Price</span>
                          <span className="text-2xl font-bold text-green-600">
                            {formatPrice(pricing.finalPrice)}
                          </span>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                          <p className="text-sm text-green-800">
                            <strong>Customer saves {formatPrice(pricing.discountAmount)}</strong>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Offer Summary */}
                <Card className="border-0 shadow-lg bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg text-gray-900">
                      <FileText className="h-5 w-5 mr-2 text-green-600" />
                      Offer Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Product</span>
                        <span className="text-gray-900 font-medium">
                          {selectedProduct ? selectedProduct.name : 'Not selected'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Discount</span>
                        <span className="text-gray-900">
                          {formData.discount_percentage ? `${formData.discount_percentage}%` : 'Not set'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration</span>
                        <span className="text-gray-900">
                          {formData.start_date && formData.expiry_date
                            ? `${new Date(formData.start_date).toLocaleDateString()} - ${new Date(formData.expiry_date).toLocaleDateString()}`
                            : 'Not set'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max Claims</span>
                        <span className="text-gray-900">
                          {formData.max_claims ? formData.max_claims : 'Unlimited'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    type="submit"
                    disabled={isLoading || !selectedProduct || !formData.discount_percentage}
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Creating Offer...</span>
                      </div>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create Offer
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/offers')}
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

export default function CreateOfferPage() {
  return (
    <BusinessRoute>
      <CreateOfferContent />
    </BusinessRoute>
  );
}