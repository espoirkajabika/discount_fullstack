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
import { AlertCircle, ArrowLeft, Edit, PlusCircle, Trash } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StorageImage } from '@/components/ui/storage-image';

function ProductDetailsContent({ params }) {
  const id = use(params).id;
  
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            className="mr-2 p-0 h-auto"
            onClick={() => router.push("/products")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="h-64 bg-gray-200 animate-pulse rounded-lg mb-6"></div>
            <div className="h-40 bg-gray-200 animate-pulse rounded-lg"></div>
          </div>
          <div>
            <div className="h-64 bg-gray-200 animate-pulse rounded-lg"></div>
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
            onClick={() => router.push("/products")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Product Details</h1>
        </div>
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-5 w-5 mr-2" />
          <AlertDescription>
            <div>
              <h3 className="font-medium">Error loading product</h3>
              <p>{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => router.push("/products")}
              >
                Return to products
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            className="mr-2 p-0 h-auto"
            onClick={() => router.push("/products")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">{product.name}</h1>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/products/${id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
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
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="aspect-square relative rounded-md overflow-hidden bg-gray-100">
                    <StorageImage
                      path={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      fallbackSize="400x400"
                      emptyIcon={
                        <p className="text-gray-400">No image available</p>
                      }
                    />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
                  <p className="text-2xl font-bold text-blue-600 mb-4">
                    {formatPrice(product.price)}
                  </p>
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Description
                    </h3>
                    <p className="text-gray-700">
                      {product.description || "No description provided."}
                    </p>
                  </div>
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      ID
                    </h3>
                    <p className="text-gray-700 text-sm font-mono">
                      {product.id}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Added on
                    </h3>
                    <p className="text-gray-700">
                      {formatDate(product.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Product Offers</CardTitle>
                <Button
                  onClick={() =>
                    router.push(`/offers/new?productId=${product.id}`)
                  }
                  size="sm"
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
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    No offers available for this product
                  </p>
                  <Button
                    onClick={() =>
                      router.push(
                        `/offers/new?productId=${product.id}`
                      )
                    }
                  >
                    Create Your First Offer
                  </Button>
                </div>
              ) : (
                <Tabs defaultValue="all">
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="expired">Expired</TabsTrigger>
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
                        <p className="text-center py-4 text-gray-500">
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
                        <p className="text-center py-4 text-gray-500">
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
                        <p className="text-center py-4 text-gray-500">
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

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  className="w-full"
                  onClick={() =>
                    router.push(`/offers/new?productId=${product.id}`)
                  }
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add New Offer
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/products/${id}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Product
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-red-600 hover:text-red-800 hover:bg-red-50"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete Product
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot
              be undone. Any offers associated with this product will also be
              deleted.
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
              onClick={handleDeleteProduct}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <span className="animate-spin mr-2">⋮</span>
                  Deleting...
                </>
              ) : (
                "Delete Product"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
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
    green: "bg-green-100 text-green-800",
    yellow: "bg-yellow-100 text-yellow-800",
    destructive: "bg-red-100 text-red-800",
    gray: "bg-gray-100 text-gray-800",
  };

  return (
    <div
      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">{offer.discount_percentage}% Off</h3>
          {offer.discount_code && (
            <p className="text-sm text-gray-600 mt-1">
              Code:{" "}
              <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">
                {offer.discount_code}
              </span>
            </p>
          )}
        </div>
        <Badge className={statusColors[status.color]}>{status.label}</Badge>
      </div>
      <div className="mt-2 text-sm text-gray-500">
        {formatDate(offer.start_date)} - {formatDate(offer.expiry_date)}
      </div>
      {offer.max_claims !== null && (
        <div className="mt-1 text-xs text-gray-500">
          {offer.current_claims} / {offer.max_claims} claimed
        </div>
      )}
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