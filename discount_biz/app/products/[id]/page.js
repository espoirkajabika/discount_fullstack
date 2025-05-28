"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import Link from "next/link";
import { getProduct, deleteProduct } from '@/lib/products';
import { getProductOffers } from '@/lib/products';
import { BusinessRoute } from '@/components/ProtectedRoute';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertCircle, 
  ArrowLeft, 
  Edit, 
  PlusCircle, 
  Trash, 
  Building2,
  Home,
  Package,
  Tag,
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  Eye,
  MoreVertical,
  Share2,
  Copy,
  ExternalLink
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
                onClick={() => router.push('/products')}
                className="text-gray-500 hover:text-green-600 transition-colors"
              >
                Products
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
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
      {children}
    </div>
  );
}

function ProductDetailsContent({ params }) {
  const id = use(params).id;
  
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getProduct(id);
        
        if (result.error) {
          setError(result.error);
          return;
        }
        
        setProduct(result.product);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to fetch product details");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchOffers = async () => {
      try {
        const result = await getProductOffers(id);
        
        if (result.error) {
          console.error("Error fetching offers:", result.error);
          return;
        }
        
        setOffers(result.offers || []);
      } catch (err) {
        console.error("Error fetching offers:", err);
      }
    };

    fetchProduct();
    fetchOffers();
  }, [id]);

  const handleDeleteProduct = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteProduct(id);
      
      if (result.error) {
        setError(result.error);
        return;
      }

      // Redirect to products list after successful deletion
      router.push("/products");
    } catch (err) {
      console.error("Error deleting product:", err);
      setError("Failed to delete product: " + err.message);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Copy product ID to clipboard
  const copyProductId = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Check if offer is active
  const isOfferActive = (offer) => {
    const now = new Date();
    const startDate = new Date(offer.start_date);
    const expiryDate = new Date(offer.expiry_date);
    return offer.is_active && now >= startDate && now <= expiryDate;
  };

  // Check if offer is expired
  const isOfferExpired = (offer) => {
    const now = new Date();
    const expiryDate = new Date(offer.expiry_date);
    return now > expiryDate;
  };

  // Check if offer is upcoming
  const isOfferUpcoming = (offer) => {
    const now = new Date();
    const startDate = new Date(offer.start_date);
    return now < startDate;
  };

  // Get offer status
  const getOfferStatus = (offer) => {
    if (isOfferExpired(offer)) {
      return { label: "Expired", color: "destructive" };
    }
    if (isOfferUpcoming(offer)) {
      return { label: "Upcoming", color: "yellow" };
    }
    if (isOfferActive(offer)) {
      return { label: "Active", color: "green" };
    }
    return { label: "Inactive", color: "gray" };
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader
          title="Product Details"
          subtitle="Loading product information..."
          backUrl="/products"
          backLabel="Back to Products"
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
                    <div className="grid grid-cols-3 gap-4">
                      <div className="h-16 w-full bg-gray-200 animate-pulse rounded"></div>
                      <div className="h-16 w-full bg-gray-200 animate-pulse rounded"></div>
                      <div className="h-16 w-full bg-gray-200 animate-pulse rounded"></div>
                    </div>
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

  if (error && !product) {
    return (
      <PageContainer>
        <PageHeader
          title="Product Details"
          subtitle="Unable to load product information"
          backUrl="/products"
          backLabel="Back to Products"
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

  if (!product) {
    return (
      <PageContainer>
        <PageHeader
          title="Product Not Found"
          subtitle="The requested product could not be found"
          backUrl="/products"
          backLabel="Back to Products"
        />
        <ContentContainer>
          <div className="text-center py-16">
            <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Package className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Product Not Found</h3>
            <p className="text-gray-600 mb-8">
              The product you're looking for doesn't exist or may have been deleted.
            </p>
            <Button 
              onClick={() => router.push('/products')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Back to Products
            </Button>
          </div>
        </ContentContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={product.name}
        subtitle="Product details and offers"
        backUrl="/products"
        backLabel="Back to Products"
      >
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/products/${id}/edit`)}
            className="border-gray-200 hover:bg-gray-50"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Product
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-gray-200">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={copyProductId}>
                <Copy className="h-4 w-4 mr-2" />
                {copied ? 'Copied!' : 'Copy Product ID'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/offers/new?productId=${product.id}`)}>
                <Tag className="h-4 w-4 mr-2" />
                Create Offer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete Product
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
            {/* Product Overview */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-gray-900">
                  <Package className="h-5 w-5 mr-2 text-green-600" />
                  Product Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100">
                      <StorageImage
                        path={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        fallbackSize="400x400"
                        emptyIcon={
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-16 w-16 text-gray-300" />
                          </div>
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold mb-2 text-gray-900">{product.name}</h2>
                    <div className="text-3xl font-bold text-green-600 mb-4">
                      {formatPrice(product.price)}
                    </div>
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">
                        Description
                      </h3>
                      <p className="text-gray-700">
                        {product.description || "No description provided."}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Product ID</span>
                        <p className="text-gray-900 font-mono text-xs">
                          {product.id.slice(0, 8)}...
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Created</span>
                        <p className="text-gray-900">
                          {formatDate(product.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Offers */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-xl text-gray-900">
                    <Tag className="h-5 w-5 mr-2 text-green-600" />
                    Product Offers
                  </CardTitle>
                  <Button
                    onClick={() =>
                      router.push(`/offers/new?productId=${product.id}`)
                    }
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Offer
                  </Button>
                </div>
                <CardDescription>
                  Manage discounts and special offers for this product
                </CardDescription>
              </CardHeader>
              <CardContent>
                {offers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Tag className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No offers available</h3>
                    <p className="text-gray-500 mb-6">
                      Create your first offer to start attracting customers with special deals.
                    </p>
                    <Button
                      onClick={() =>
                        router.push(
                          `/offers/new?productId=${product.id}`
                        )
                      }
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create Your First Offer
                    </Button>
                  </div>
                ) : (
                  <Tabs defaultValue="all">
                    <TabsList className="mb-4 bg-gray-100">
                      <TabsTrigger value="all" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">All</TabsTrigger>
                      <TabsTrigger value="active" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Active</TabsTrigger>
                      <TabsTrigger value="upcoming" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Upcoming</TabsTrigger>
                      <TabsTrigger value="expired" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Expired</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all">
                      <div className="space-y-4">
                        {offers.map((offer) => (
                          <OfferCard
                            key={offer.id}
                            offer={offer}
                            onClick={() =>
                              router.push(`/offers/${offer.id}`)
                            }
                          />
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="active">
                      <div className="space-y-4">
                        {offers.filter((offer) => isOfferActive(offer)).length ===
                        0 ? (
                          <p className="text-center py-8 text-gray-500">
                            No active offers found
                          </p>
                        ) : (
                          offers
                            .filter((offer) => isOfferActive(offer))
                            .map((offer) => (
                              <OfferCard
                                key={offer.id}
                                offer={offer}
                                onClick={() =>
                                  router.push(`/offers/${offer.id}`)
                                }
                              />
                            ))
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="upcoming">
                      <div className="space-y-4">
                        {offers.filter((offer) => isOfferUpcoming(offer))
                          .length === 0 ? (
                          <p className="text-center py-8 text-gray-500">
                            No upcoming offers found
                          </p>
                        ) : (
                          offers
                            .filter((offer) => isOfferUpcoming(offer))
                            .map((offer) => (
                              <OfferCard
                                key={offer.id}
                                offer={offer}
                                onClick={() =>
                                  router.push(`/offers/${offer.id}`)
                                }
                              />
                            ))
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="expired">
                      <div className="space-y-4">
                        {offers.filter((offer) => isOfferExpired(offer))
                          .length === 0 ? (
                          <p className="text-center py-8 text-gray-500">
                            No expired offers found
                          </p>
                        ) : (
                          offers
                            .filter((offer) => isOfferExpired(offer))
                            .map((offer) => (
                              <OfferCard
                                key={offer.id}
                                offer={offer}
                                onClick={() =>
                                  router.push(`/offers/${offer.id}`)
                                }
                              />
                            ))
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
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
                  onClick={() =>
                    router.push(`/offers/new?productId=${product.id}`)
                  }
                  className="w-full h-10 bg-green-600 hover:bg-green-700 text-white"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add New Offer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/products/${id}/edit`)}
                  className="w-full h-10 border-gray-200 hover:bg-gray-50"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Product
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/products')}
                  className="w-full h-10 border-gray-200 hover:bg-gray-50"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View All Products
                </Button>
              </CardContent>
            </Card>

            {/* Product Information */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">Product Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div>
                    <span className="text-gray-500">Product ID</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-gray-900 font-mono text-xs">
                        {product.id.slice(0, 8)}...
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={copyProductId}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-500">Price</span>
                    <p className="text-gray-900 font-semibold mt-1">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-gray-500">Created</span>
                    <p className="text-gray-900 mt-1">
                      {new Date(product.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-gray-500">Last Updated</span>
                    <p className="text-gray-900 mt-1">
                      {new Date(product.updated_at || product.created_at).toLocaleDateString()}
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
                      {offers.length}
                    </div>
                    <p className="text-sm text-green-800">Total Offers</p>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {offers.filter(offer => isOfferActive(offer)).length}
                    </div>
                    <p className="text-sm text-blue-800">Active Offers</p>
                  </div>
                  
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {offers.reduce((total, offer) => total + (offer.current_claims || 0), 0)}
                    </div>
                    <p className="text-sm text-yellow-800">Total Claims</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-0 shadow-lg bg-white border-red-100">
              <CardHeader>
                <CardTitle className="flex items-center text-lg text-red-600">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Once you delete a product, there is no going back. All offers for this product will also be deleted.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(true)}
                  className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete Product
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center text-red-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                Delete Product
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this product? This action cannot
                be undone. Any offers associated with this product will also be
                deleted.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-gray-50 rounded-lg p-4 my-4">
              <h4 className="font-medium text-gray-900 mb-2">
                {product.name}
              </h4>
              <p className="text-sm text-gray-600">
                {formatPrice(product.price)} • {offers.length} offers
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteProduct}
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
                    <Trash className="h-4 w-4 mr-2" />
                    Delete Product
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ContentContainer>
    </PageContainer>
  );
}

// Offer Card Component
function OfferCard({ offer, onClick }) {
  // Format date
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get offer status
  const getStatus = (offer) => {
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

  const status = getStatus(offer);

  // Status colors
  const statusColors = {
    green: "bg-green-100 text-green-800 border-green-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    destructive: "bg-red-100 text-red-800 border-red-200",
    gray: "bg-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <div
      className="border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-green-200 transition-all duration-200 cursor-pointer bg-white group"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <Tag className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
              {offer.discount_percentage}% Off
            </h3>
            {offer.discount_code && (
              <p className="text-sm text-gray-600 mt-1">
                Code:{" "}
                <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-xs">
                  {offer.discount_code}
                </span>
              </p>
            )}
          </div>
        </div>
        <Badge className={`${statusColors[status.color]} font-medium`}>
          {status.label}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Period</span>
          <p className="text-gray-900 mt-1">
            {formatDate(offer.start_date)} - {formatDate(offer.expiry_date)}
          </p>
        </div>
        <div>
          <span className="text-gray-500">Claims</span>
          <p className="text-gray-900 mt-1">
            {offer.current_claims || 0}
            {offer.max_claims !== null && ` / ${offer.max_claims}`}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailsPage({ params }) {
  return (
    <BusinessRoute>
      <ProductDetailsContent params={params} />
    </BusinessRoute>
  );
}