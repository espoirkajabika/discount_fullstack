"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createOffer } from "@/lib/offers";
import { getProducts } from "@/lib/products";
import { useAuth } from "@/context/AuthContext";
import { BusinessRoute } from "@/components/ProtectedRoute";

// Import components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  FileText,
  ShoppingCart,
  Gift,
} from "lucide-react";

// Discount type configurations
const DISCOUNT_TYPES = {
  percentage: {
    label: "Percentage Off",
    description: "Give customers a percentage discount (e.g., 20% off)",
    icon: Percent,
    fields: ["discount_value"],
    example: "20% Off",
  },
  fixed: {
    label: "Fixed Amount Off",
    description: "Give customers a fixed dollar amount off (e.g., $10 off)",
    icon: DollarSign,
    fields: ["discount_value"],
    example: "$10 Off",
  },
  minimum_purchase: {
    label: "Minimum Purchase Discount",
    description: "Discount when customers spend over a certain amount",
    icon: ShoppingCart,
    fields: ["discount_value", "minimum_purchase_amount"],
    example: "$15 Off Orders Over $50",
  },
  quantity_discount: {
    label: "Quantity Discount",
    description: "Discount when customers buy multiple items",
    icon: Package,
    fields: ["discount_value", "minimum_quantity"],
    example: "Buy 3+ Get 20% Off Each",
  },
  bogo: {
    label: "Buy X Get Y",
    description: "Buy a certain quantity and get items free or discounted",
    icon: Gift,
    fields: ["buy_quantity", "get_quantity", "get_discount_percentage"],
    example: "Buy 2 Get 1 Free",
  },
};

// Page components (keeping your existing ones)
function PageContainer({ children, className = "" }) {
  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 ${className}`}
    >
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
  children,
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
                onClick={() => router.push("/dashboard")}
                className="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </button>
              <span className="text-gray-400">/</span>
              <button
                onClick={() => router.push("/offers")}
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
              onClick={() => router.push("/dashboard")}
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
                {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
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

  // Updated state for form data with new discount type fields
  const [formData, setFormData] = useState({
    product_id: "",
    discount_type: "",
    discount_value: "",
    minimum_purchase_amount: "",
    minimum_quantity: "",
    buy_quantity: "",
    get_quantity: "",
    get_discount_percentage: "",
    discount_code: "",
    start_date: "",
    expiry_date: "",
    max_claims: "",
    is_active: true,
    terms_conditions: "",
  });

  // State for products and UI
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Load user's products
  const loadProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const result = await getProducts({ limit: 100 });
      if (result.error) {
        setError(result.error);
      } else {
        setProducts(result.products || []);
      }
    } catch (err) {
      console.error("Error loading products:", err);
      setError("Failed to load products. Please try again.");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (error) setError("");
  };

  // Handle discount type change
  const handleDiscountTypeChange = (discountType) => {
    setFormData((prev) => ({
      ...prev,
      discount_type: discountType,
      // Reset all discount-related fields when type changes
      discount_value: "",
      minimum_purchase_amount: "",
      minimum_quantity: "",
      buy_quantity: "",
      get_quantity: "",
      get_discount_percentage: "",
    }));
  };

  // Handle product selection
  const handleProductSelect = (productId) => {
    const product = products.find((p) => p.id === productId);
    setSelectedProduct(product);
    handleInputChange("product_id", productId);
  };

  // Calculate pricing preview
  const calculatePricing = () => {
    if (
      !selectedProduct ||
      !formData.discount_value ||
      !formData.discount_type
    ) {
      return null;
    }

    const originalPrice = parseFloat(selectedProduct.price) || 0;

    if (formData.discount_type === "percentage") {
      const discountPercent = parseFloat(formData.discount_value) || 0;
      const discountAmount = (originalPrice * discountPercent) / 100;
      const finalPrice = originalPrice - discountAmount;

      return {
        originalPrice,
        discountAmount,
        finalPrice,
        discountPercent,
      };
    } else if (formData.discount_type === "fixed") {
      const discountAmount = Math.min(
        parseFloat(formData.discount_value) || 0,
        originalPrice
      );
      const finalPrice = originalPrice - discountAmount;

      return {
        originalPrice,
        discountAmount,
        finalPrice,
        discountPercent: null,
      };
    }

    return null;
  };

  // Format currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Get date one week from today
  const getNextWeekDate = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split("T")[0];
  };

  // Validate form
  const validateForm = () => {
    if (!formData.product_id) {
      setError("Please select a product for this offer.");
      return false;
    }

    if (!formData.discount_type) {
      setError("Please select a discount type.");
      return false;
    }

    // Check required fields for the selected discount type
    const config = DISCOUNT_TYPES[formData.discount_type];
    for (const field of config.fields) {
      if (!formData[field] || formData[field] === "") {
        setError(`Please fill in all required fields for ${config.label}.`);
        return false;
      }
    }

    // Validate percentage constraints
    if (
      formData.discount_type === "percentage" &&
      (formData.discount_value <= 0 || formData.discount_value > 100)
    ) {
      setError("Percentage discount must be between 1 and 100.");
      return false;
    }

    if (!formData.start_date) {
      setError("Please select a start date for the offer.");
      return false;
    }

    if (!formData.expiry_date) {
      setError("Please select an expiry date for the offer.");
      return false;
    }

    if (new Date(formData.start_date) >= new Date(formData.expiry_date)) {
      setError("Expiry date must be after the start date.");
      return false;
    }

    if (
      formData.max_claims &&
      (formData.max_claims <= 0 || formData.max_claims > 10000)
    ) {
      setError("Maximum claims must be between 1 and 10,000.");
      return false;
    }

    return true;
  };

  // Handle form submission
  // Replace the handleSubmit function in your CreateOfferContent component

 const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }
  
  setIsLoading(true);
  setError('');
  
  try {
    // Base offer data
    const offerData = {
      product_id: formData.product_id,
      discount_type: formData.discount_type,
      start_date: formData.start_date + 'T00:00:00Z',
      expiry_date: formData.expiry_date + 'T23:59:59Z',
      is_active: formData.is_active,
      max_claims: formData.max_claims ? parseInt(formData.max_claims) : null,
      terms_conditions: formData.terms_conditions || null
    };

    // Add type-specific fields
    const config = DISCOUNT_TYPES[formData.discount_type];
    config.fields.forEach(field => {
      if (field === 'discount_value' || field === 'minimum_purchase_amount' || field === 'get_discount_percentage') {
        offerData[field] = parseFloat(formData[field]);
      } else if (field === 'minimum_quantity' || field === 'buy_quantity' || field === 'get_quantity') {
        offerData[field] = parseInt(formData[field]);
      }
    });
    
    console.log('Creating offer with data:', offerData);
    
    // 🎯 USE THE CREATEOFFER FUNCTION FROM LIB/OFFERS.JS
    const result = await createOffer(offerData);
    
    if (result.error) {
      setError(result.error);
      return;
    }
    
    // Success - redirect to offers page
    router.push('/offers');
  } catch (err) {
    console.error('Error creating offer:', err);
    setError(err.message || 'Failed to create offer. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

  // Initialize dates
  useEffect(() => {
    if (!formData.start_date) {
      setFormData((prev) => ({
        ...prev,
        start_date: getTodayDate(),
        expiry_date: getNextWeekDate(),
      }));
    }
  }, []);

  // Render discount fields based on selected type
  const renderDiscountFields = () => {
    if (!formData.discount_type) return null;

    const config = DISCOUNT_TYPES[formData.discount_type];

    return (
      <div className="space-y-4">
        {/* Main discount value field */}
        {config.fields.includes("discount_value") && (
          <div>
            <Label
              htmlFor="discount_value"
              className="text-gray-700 font-semibold"
            >
              {formData.discount_type === "percentage"
                ? "Discount Percentage *"
                : "Discount Amount *"}
            </Label>
            <div className="relative mt-2">
              {formData.discount_type !== "percentage" && (
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
              )}
              <Input
                id="discount_value"
                type="number"
                step={formData.discount_type === "percentage" ? "1" : "0.01"}
                min="0"
                max={
                  formData.discount_type === "percentage" ? "100" : undefined
                }
                value={formData.discount_value}
                onChange={(e) =>
                  handleInputChange("discount_value", e.target.value)
                }
                className={`h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500 ${
                  formData.discount_type !== "percentage" ? "pl-8" : "pr-8"
                }`}
                placeholder={
                  formData.discount_type === "percentage" ? "20" : "10.00"
                }
              />
              {formData.discount_type === "percentage" && (
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  %
                </span>
              )}
            </div>
          </div>
        )}

        {/* Minimum purchase amount */}
        {config.fields.includes("minimum_purchase_amount") && (
          <div>
            <Label
              htmlFor="minimum_purchase_amount"
              className="text-gray-700 font-semibold"
            >
              Minimum Purchase Amount *
            </Label>
            <div className="relative mt-2">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                $
              </span>
              <Input
                id="minimum_purchase_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.minimum_purchase_amount}
                onChange={(e) =>
                  handleInputChange("minimum_purchase_amount", e.target.value)
                }
                className="pl-8 h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
                placeholder="50.00"
              />
            </div>
          </div>
        )}

        {/* Minimum quantity */}
        {config.fields.includes("minimum_quantity") && (
          <div>
            <Label
              htmlFor="minimum_quantity"
              className="text-gray-700 font-semibold"
            >
              Minimum Quantity Required *
            </Label>
            <Input
              id="minimum_quantity"
              type="number"
              min="1"
              value={formData.minimum_quantity}
              onChange={(e) =>
                handleInputChange("minimum_quantity", e.target.value)
              }
              className="mt-2 h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
              placeholder="3"
            />
          </div>
        )}

        {/* BOGO fields */}
        {config.fields.includes("buy_quantity") && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label
                htmlFor="buy_quantity"
                className="text-gray-700 font-semibold"
              >
                Buy Quantity *
              </Label>
              <Input
                id="buy_quantity"
                type="number"
                min="1"
                value={formData.buy_quantity}
                onChange={(e) =>
                  handleInputChange("buy_quantity", e.target.value)
                }
                className="mt-2 h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
                placeholder="2"
              />
            </div>
            <div>
              <Label
                htmlFor="get_quantity"
                className="text-gray-700 font-semibold"
              >
                Get Quantity *
              </Label>
              <Input
                id="get_quantity"
                type="number"
                min="1"
                value={formData.get_quantity}
                onChange={(e) =>
                  handleInputChange("get_quantity", e.target.value)
                }
                className="mt-2 h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
                placeholder="1"
              />
            </div>
            <div>
              <Label
                htmlFor="get_discount_percentage"
                className="text-gray-700 font-semibold"
              >
                Get Discount % *
              </Label>
              <div className="relative mt-2">
                <Input
                  id="get_discount_percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.get_discount_percentage}
                  onChange={(e) =>
                    handleInputChange("get_discount_percentage", e.target.value)
                  }
                  className="pr-8 h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
                  placeholder="100"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  %
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                100% = Free, 50% = Half price
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const pricing = calculatePricing();


  const testAPI = async () => {
  const token = localStorage.getItem('auth_token');
  
  const testData = {
    product_id: formData.product_id, // Use your actual product ID
    discount_type: "percentage",
    discount_value: 20,
    start_date: "2024-01-01T00:00:00Z", 
    expiry_date: "2024-12-31T23:59:59Z",
    is_active: true
  };
  
  try {
    const response = await fetch('http://localhost:8001/api/v1/business/offers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Response text:', text);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};





  return (
    <PageContainer>
      <PageHeader
        title="Create New Offer"
        subtitle="Set up a special discount for your customers"
        backUrl="/offers"
        backLabel="Back to Offers"
      />

      <ContentContainer>
        <Button type="button" onClick={testAPI}>Test API Direct</Button>
        {error && (
          <Alert
            variant="destructive"
            className="mb-6 bg-red-50 border-red-200"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
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
                    <Label
                      htmlFor="product"
                      className="text-gray-700 font-semibold"
                    >
                      Choose Product *
                    </Label>
                    <Select
                      value={formData.product_id}
                      onValueChange={handleProductSelect}
                      disabled={isLoadingProducts}
                    >
                      <SelectTrigger className="mt-2 h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500">
                        <SelectValue
                          placeholder={
                            isLoadingProducts
                              ? "Loading products..."
                              : "Select a product"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {products.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p>No products available</p>
                            <Button
                              size="sm"
                              className="mt-2"
                              onClick={() => router.push("/products/new")}
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
                                  <p className="text-sm text-gray-500">
                                    {formatPrice(product.price)}
                                  </p>
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
                          <h4 className="font-semibold text-gray-900">
                            {selectedProduct.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {selectedProduct.description || "No description"}
                          </p>
                          <p className="text-lg font-bold text-green-600">
                            {formatPrice(selectedProduct.price)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Discount Type Selection */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg text-gray-900">
                    <Tag className="h-5 w-5 mr-2 text-green-600" />
                    Discount Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label
                      htmlFor="discount_type"
                      className="text-gray-700 font-semibold"
                    >
                      Choose Discount Type *
                    </Label>
                    <Select
                      value={formData.discount_type}
                      onValueChange={handleDiscountTypeChange}
                    >
                      <SelectTrigger className="mt-2 h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500">
                        <SelectValue placeholder="Select a discount type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(DISCOUNT_TYPES).map(
                          ([type, config]) => {
                            const Icon = config.icon;
                            return (
                              <SelectItem key={type} value={type}>
                                <div className="flex items-center space-x-3">
                                  <Icon className="h-4 w-4 text-gray-400" />
                                  <div>
                                    <p className="font-medium">
                                      {config.label}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {config.example}
                                    </p>
                                  </div>
                                </div>
                              </SelectItem>
                            );
                          }
                        )}
                      </SelectContent>
                    </Select>

                    {formData.discount_type && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>
                            {DISCOUNT_TYPES[formData.discount_type].label}:
                          </strong>{" "}
                          {DISCOUNT_TYPES[formData.discount_type].description}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Discount Details */}
              {formData.discount_type && (
                <Card className="border-0 shadow-lg bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg text-gray-900">
                      <Percent className="h-5 w-5 mr-2 text-green-600" />
                      Discount Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>{renderDiscountFields()}</CardContent>
                </Card>
              )}

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
                      <Label
                        htmlFor="start_date"
                        className="text-gray-700 font-semibold"
                      >
                        Start Date *
                      </Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) =>
                          handleInputChange("start_date", e.target.value)
                        }
                        min={getTodayDate()}
                        className="mt-2 h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="expiry_date"
                        className="text-gray-700 font-semibold"
                      >
                        Expiry Date *
                      </Label>
                      <Input
                        id="expiry_date"
                        type="date"
                        value={formData.expiry_date}
                        onChange={(e) =>
                          handleInputChange("expiry_date", e.target.value)
                        }
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
                    <Label
                      htmlFor="max_claims"
                      className="text-gray-700 font-semibold"
                    >
                      Maximum Claims (Optional)
                    </Label>
                    <Input
                      id="max_claims"
                      type="number"
                      min="1"
                      max="10000"
                      value={formData.max_claims}
                      onChange={(e) =>
                        handleInputChange("max_claims", e.target.value)
                      }
                      placeholder="Leave empty for unlimited"
                      className="mt-2 h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Limit how many customers can claim this offer
                    </p>
                  </div>

                  <div>
                    <Label
                      htmlFor="terms_conditions"
                      className="text-gray-700 font-semibold"
                    >
                      Terms & Conditions (Optional)
                    </Label>
                    <Textarea
                      id="terms_conditions"
                      value={formData.terms_conditions}
                      onChange={(e) =>
                        handleInputChange("terms_conditions", e.target.value)
                      }
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
                          <span className="text-gray-600">
                            Discount{" "}
                            {pricing.discountPercent
                              ? `(${pricing.discountPercent}%)`
                              : ""}
                          </span>
                          <span className="text-red-600 font-medium">
                            -{formatPrice(pricing.discountAmount)}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                          <span className="text-gray-900 font-semibold">
                            Final Price
                          </span>
                          <span className="text-2xl font-bold text-green-600">
                            {formatPrice(pricing.finalPrice)}
                          </span>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                          <p className="text-sm text-green-800">
                            <strong>
                              Customer saves{" "}
                              {formatPrice(pricing.discountAmount)}
                            </strong>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {/* Offer Summary */}
                <Card className="border-0 shadow-lg bg-white overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-100">
                    <CardTitle className="flex items-center text-lg text-gray-900">
                      <FileText className="h-5 w-5 mr-2 text-green-600" />
                      Offer Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-gray-100">
                      {/* Product Section */}
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <Package className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">
                                Product
                              </p>
                              <p className="text-base font-semibold text-gray-900">
                                {selectedProduct
                                  ? selectedProduct.name
                                  : "Not selected"}
                              </p>
                              {selectedProduct && (
                                <p className="text-sm text-gray-500">
                                  {formatPrice(selectedProduct.price)}
                                </p>
                              )}
                            </div>
                          </div>
                          {!selectedProduct && (
                            <Badge
                              variant="outline"
                              className="text-orange-600 border-orange-200"
                            >
                              Required
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Discount Type Section */}
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              {formData.discount_type ? (
                                (() => {
                                  const IconComponent =
                                    DISCOUNT_TYPES[formData.discount_type].icon;
                                  return (
                                    <IconComponent className="h-5 w-5 text-blue-600" />
                                  );
                                })()
                              ) : (
                                <Tag className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">
                                Discount Type
                              </p>
                              <p className="text-base font-semibold text-gray-900">
                                {formData.discount_type
                                  ? DISCOUNT_TYPES[formData.discount_type].label
                                  : "Not selected"}
                              </p>
                              {formData.discount_type && (
                                <p className="text-sm text-gray-500">
                                  {
                                    DISCOUNT_TYPES[formData.discount_type]
                                      .example
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                          {!formData.discount_type && (
                            <Badge
                              variant="outline"
                              className="text-orange-600 border-orange-200"
                            >
                              Required
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Discount Details Section */}
                      {formData.discount_type && (
                        <div className="p-4 bg-gray-50">
                          <p className="text-sm font-medium text-gray-500 mb-3">
                            Discount Details
                          </p>
                          <div className="space-y-2">
                            {/* Main discount value */}
                            {DISCOUNT_TYPES[
                              formData.discount_type
                            ].fields.includes("discount_value") && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">
                                  {formData.discount_type === "percentage"
                                    ? "Percentage"
                                    : "Amount"}
                                </span>
                                <span className="text-sm font-medium text-gray-900">
                                  {formData.discount_value ? (
                                    formData.discount_type === "percentage" ? (
                                      `${formData.discount_value}%`
                                    ) : (
                                      `$${formData.discount_value}`
                                    )
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="text-orange-600 border-orange-200"
                                    >
                                      Required
                                    </Badge>
                                  )}
                                </span>
                              </div>
                            )}

                            {/* Minimum purchase */}
                            {formData.discount_type === "minimum_purchase" && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">
                                  Minimum Purchase
                                </span>
                                <span className="text-sm font-medium text-gray-900">
                                  {formData.minimum_purchase_amount ? (
                                    `$${formData.minimum_purchase_amount}`
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="text-orange-600 border-orange-200"
                                    >
                                      Required
                                    </Badge>
                                  )}
                                </span>
                              </div>
                            )}

                            {/* Minimum quantity */}
                            {formData.discount_type === "quantity_discount" && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">
                                  Minimum Quantity
                                </span>
                                <span className="text-sm font-medium text-gray-900">
                                  {formData.minimum_quantity ? (
                                    `${formData.minimum_quantity} items`
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="text-orange-600 border-orange-200"
                                    >
                                      Required
                                    </Badge>
                                  )}
                                </span>
                              </div>
                            )}

                            {/* BOGO details */}
                            {formData.discount_type === "bogo" && (
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">
                                    Buy Quantity
                                  </span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {formData.buy_quantity || (
                                      <Badge
                                        variant="outline"
                                        className="text-orange-600 border-orange-200"
                                      >
                                        Required
                                      </Badge>
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">
                                    Get Quantity
                                  </span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {formData.get_quantity || (
                                      <Badge
                                        variant="outline"
                                        className="text-orange-600 border-orange-200"
                                      >
                                        Required
                                      </Badge>
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">
                                    Get Discount
                                  </span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {formData.get_discount_percentage ? (
                                      formData.get_discount_percentage ===
                                      "100" ? (
                                        "Free"
                                      ) : (
                                        `${formData.get_discount_percentage}% Off`
                                      )
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="text-orange-600 border-orange-200"
                                      >
                                        Required
                                      </Badge>
                                    )}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Duration Section */}
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Calendar className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">
                                Duration
                              </p>
                              {formData.start_date && formData.expiry_date ? (
                                <div>
                                  <p className="text-base font-semibold text-gray-900">
                                    {(() => {
                                      const start = new Date(
                                        formData.start_date
                                      );
                                      const end = new Date(
                                        formData.expiry_date
                                      );
                                      const diffTime = Math.abs(end - start);
                                      const diffDays = Math.ceil(
                                        diffTime / (1000 * 60 * 60 * 24)
                                      );
                                      return `${diffDays} day${
                                        diffDays === 1 ? "" : "s"
                                      }`;
                                    })()}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {new Date(
                                      formData.start_date
                                    ).toLocaleDateString()}{" "}
                                    -{" "}
                                    {new Date(
                                      formData.expiry_date
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-base font-semibold text-gray-900">
                                  Not set
                                </p>
                              )}
                            </div>
                          </div>
                          {(!formData.start_date || !formData.expiry_date) && (
                            <Badge
                              variant="outline"
                              className="text-orange-600 border-orange-200"
                            >
                              Required
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Claims Section */}
                      <div className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <Users className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Maximum Claims
                            </p>
                            <p className="text-base font-semibold text-gray-900">
                              {formData.max_claims ? (
                                <span className="flex items-center space-x-2">
                                  <span>{formData.max_claims}</span>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Limited
                                  </Badge>
                                </span>
                              ) : (
                                <span className="flex items-center space-x-2">
                                  <span>Unlimited</span>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs bg-green-100 text-green-800"
                                  >
                                    Open
                                  </Badge>
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Offer Preview */}
                      {formData.discount_type &&
                        formData.discount_value &&
                        selectedProduct && (
                          <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50">
                            <p className="text-sm font-medium text-gray-500 mb-2">
                              Offer Preview
                            </p>
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-gray-900">
                                    {selectedProduct.name}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {(() => {
                                      switch (formData.discount_type) {
                                        case "percentage":
                                          return `${formData.discount_value}% Off`;
                                        case "fixed":
                                          return `$${formData.discount_value} Off`;
                                        case "minimum_purchase":
                                          return `$${formData.discount_value} Off Orders Over $${formData.minimum_purchase_amount}`;
                                        case "quantity_discount":
                                          return `Buy ${formData.minimum_quantity}+ Get ${formData.discount_value}% Off Each`;
                                        case "bogo":
                                          return `Buy ${
                                            formData.buy_quantity
                                          } Get ${formData.get_quantity} ${
                                            formData.get_discount_percentage ===
                                            "100"
                                              ? "Free"
                                              : `${formData.get_discount_percentage}% Off`
                                          }`;
                                        default:
                                          return "Special Offer";
                                      }
                                    })()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  {pricing && (
                                    <div>
                                      <p className="text-sm text-gray-500 line-through">
                                        {formatPrice(pricing.originalPrice)}
                                      </p>
                                      <p className="text-lg font-bold text-green-600">
                                        {formatPrice(pricing.finalPrice)}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    type="submit"
                    disabled={
                      isLoading || !selectedProduct || !formData.discount_type
                    }
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
                    onClick={() => router.push("/offers")}
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
