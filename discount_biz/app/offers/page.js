// app/offers/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getOffers } from '@/lib/offers';
import { useAuth } from "@/context/AuthContext";
import BusinessLayout from '@/components/BusinessLayout';

// Import components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Search,
  SlidersHorizontal,
  Tag,
  Percent,
  Clock,
  X,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StorageImage } from "@/components/ui/storage-image";

function OffersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, initialized } = useAuth();

  // State variables
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [activeFilterTab, setActiveFilterTab] = useState("all");
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  // Initialize from search params
  useEffect(() => {
    const page = parseInt(searchParams.get("page")) || 1;
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const status = searchParams.get("status");

    setPagination((prev) => ({ ...prev, page }));
    setSearchTerm(search);
    setSortBy(sortBy);
    setSortOrder(sortOrder);
    if (status) setActiveFilterTab(status);
  }, [searchParams]);

  // Fetch offers data
  useEffect(() => {
    if (!initialized) return;
    fetchOffers();
  }, [pagination.page, searchTerm, sortBy, sortOrder, activeFilterTab, retryCount, initialized]);

  const fetchOffers = async () => {
    setIsLoading(true);
    setError("");
  
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sortBy,
        sortOrder: sortOrder,
      };
  
      if (searchTerm) {
        params.search = searchTerm;
      }
  
      if (activeFilterTab !== "all") {
        params.status = activeFilterTab;
      }
  
      console.log("Fetching offers with params:", params);
      const result = await getOffers(params);

      if (result.error) {
        if (result.error.includes('401') && isLoggedIn && retryCount < maxRetries) {
          console.log(`Auth error detected. Retrying (${retryCount + 1}/${maxRetries})...`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 1000 * (retryCount + 1));
          return;
        }
        
        if (result.error.includes("Unauthorized")) {
          setError("You need to be logged in to view offers. Please sign in again.");
        } else {
          setError(result.error);
        }
        return;
      }
  
      setOffers(result.offers || []);
      setPagination(prev => ({
        ...prev,
        ...result.pagination
      }));
    } catch (err) {
      console.error("Error fetching offers:", err);
      setError("Failed to fetch offers. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOffers();
    setRefreshing(false);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    updateUrlParams();
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm("");
    setPagination((prev) => ({ ...prev, page: 1 }));
    updateUrlParams({ search: "" });
  };

  // Handle sort change
  const handleSortChange = (newSortBy) => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }

    setPagination((prev) => ({ ...prev, page: 1 }));
    updateUrlParams({
      sortBy: newSortBy,
      sortOrder: newSortBy === sortBy ? (sortOrder === "asc" ? "desc" : "asc") : "desc",
    });
  };

  // Handle status tab change
  const handleStatusChange = (status) => {
    setActiveFilterTab(status);
    setPagination((prev) => ({ ...prev, page: 1 }));
    updateUrlParams({ status: status === "all" ? null : status });
  };

  // Update URL parameters
  const updateUrlParams = (overrides = {}) => {
    const params = new URLSearchParams();

    const page = overrides.page !== undefined ? overrides.page : pagination.page;
    const search = overrides.search !== undefined ? overrides.search : searchTerm;
    const newSortBy = overrides.sortBy !== undefined ? overrides.sortBy : sortBy;
    const newSortOrder = overrides.sortOrder !== undefined ? overrides.sortOrder : sortOrder;
    const status = overrides.status !== undefined ? overrides.status : activeFilterTab !== "all" ? activeFilterTab : null;

    if (page > 1) params.append("page", page);
    if (search) params.append("search", search);
    if (newSortBy !== "created_at") params.append("sortBy", newSortBy);
    if (newSortOrder !== "desc") params.append("sortOrder", newSortOrder);
    if (status) params.append("status", status);

    const newUrl = `${window.location.pathname}${params.toString() ? "?" + params.toString() : ""}`;
    window.history.pushState({}, "", newUrl);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    updateUrlParams({ page: newPage });
    window.scrollTo(0, 0);
  };

  // Format currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get offer status
  const getOfferStatus = (offer) => {
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

  // Status colors
  const statusColors = {
    green: "bg-green-100 text-green-800 border-green-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    destructive: "bg-red-100 text-red-800 border-red-200",
    gray: "bg-gray-100 text-gray-800 border-gray-200",
  };

  // Empty state component
  const EmptyState = () => (
    <div className="text-center py-16">
      <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Tag className="h-10 w-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No offers found</h3>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        {searchTerm
          ? "Try adjusting your search terms or filters to find what you're looking for."
          : "Create your first offer to start attracting customers with special deals and discounts."}
      </p>
      {searchTerm ? (
        <Button 
          onClick={handleClearSearch}
          variant="outline"
          className="border-orange-200 text-orange-600 hover:bg-orange-50"
        >
          Clear search
        </Button>
      ) : (
        <Button 
          onClick={() => router.push("/offers/new")}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Your First Offer
        </Button>
      )}
    </div>
  );

  // Loading skeleton component
  const OfferSkeleton = () => (
    <div className="border border-gray-200 rounded-xl p-6 mb-4 space-y-4 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex space-x-4">
          <div className="w-16 h-16 bg-gray-100 animate-pulse rounded-lg"></div>
          <div className="flex-1">
            <div className="h-5 w-48 bg-gray-100 animate-pulse rounded mb-2"></div>
            <div className="h-7 w-24 bg-gray-100 animate-pulse rounded"></div>
          </div>
        </div>
        <div className="h-6 w-20 bg-gray-100 animate-pulse rounded-full"></div>
      </div>
      <div className="flex justify-between">
        <div className="h-4 w-56 bg-gray-100 animate-pulse rounded"></div>
        <div className="h-4 w-32 bg-gray-100 animate-pulse rounded"></div>
      </div>
    </div>
  );

  // Offer Card component
  const OfferCard = ({ offer }) => {
    const status = getOfferStatus(offer);
    const productName = offer.products?.name || offer.product?.name || "Unknown Product";
    const productPrice = offer.products?.price || offer.product?.price || 0;
    const discountAmount = ((productPrice * offer.discount_percentage) / 100).toFixed(2);
    const finalPrice = (productPrice - discountAmount).toFixed(2);

    return (
      <div
        className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-orange-200 transition-all duration-200 cursor-pointer bg-white group"
        onClick={() => router.push(`/offers/${offer.id}`)}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                <StorageImage
                  path={offer.products?.image_url || offer.product?.image_url}
                  alt={productName}
                  className="w-full h-full object-cover"
                  fallbackSize="64x64"
                  emptyIcon={
                    <div className="w-full h-full flex items-center justify-center">
                      <Tag className="h-6 w-6 text-gray-300" />
                    </div>
                  }
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors mb-1">
                  {productName}
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                    <Percent className="h-4 w-4 mr-1" />
                    <span className="font-bold">{offer.discount_percentage}% OFF</span>
                  </div>
                </div>
              </div>
            </div>
            <Badge className={`${statusColors[status.color]} font-medium`}>
              {status.label}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Offer Period</p>
              <div className="flex items-center text-sm text-gray-700">
                <Clock className="h-4 w-4 mr-1 text-gray-400" />
                {formatDate(offer.start_date)} - {formatDate(offer.expiry_date)}
              </div>
              {offer.discount_code && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Discount Code</p>
                  <span className="inline-block font-mono bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                    {offer.discount_code}
                  </span>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Pricing</p>
              <div className="space-y-1">
                <p className="text-sm text-gray-600 line-through">
                  {formatPrice(productPrice)}
                </p>
                <p className="text-lg font-bold text-orange-600">
                  {formatPrice(finalPrice)}
                </p>
                <p className="text-xs text-orange-600">
                  Save {formatPrice(discountAmount)}
                </p>
              </div>
            </div>
          </div>

          {offer.max_claims !== null && (
            <div className="pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  Claims: {offer.current_claims} / {offer.max_claims}
                </span>
                <span className="text-gray-600">
                  {Math.round((offer.current_claims / offer.max_claims) * 100)}% claimed
                </span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((offer.current_claims / offer.max_claims) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render pagination controls
  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-8 p-4 bg-white rounded-xl border border-gray-200">
        <div className="text-sm text-gray-600">
          Showing {(pagination.page - 1) * pagination.limit + 1}
          {pagination.page * pagination.limit < pagination.total
            ? ` - ${pagination.page * pagination.limit}`
            : ""}{" "}
          of {pagination.total} offers
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="border-gray-200 hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {renderPageNumbers()}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="border-gray-200 hover:bg-gray-50"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // Render page numbers
  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxVisible = 5;

    let startPage = Math.max(1, pagination.page - Math.floor(maxVisible / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <Button
          key={i}
          variant={pagination.page === i ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageChange(i)}
          className={pagination.page === i 
            ? "bg-orange-600 hover:bg-orange-700 text-white" 
            : "border-gray-200 hover:bg-gray-50"
          }
        >
          {i}
        </Button>
      );
    }

    return pageNumbers;
  };

  return (
    <BusinessLayout
      title="Offers & Discounts"
      subtitle="Manage special offers and discounts for your products"
      onRefresh={handleRefresh}
      refreshing={refreshing}
      showRefresh={true}
    >
      {error && (
        <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Create Offer Button */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Your Offers</h3>
          <p className="text-gray-600">
            {pagination.total > 0 ? `${pagination.total} offers created` : 'No offers created yet'}
          </p>
        </div>
        <Button 
          onClick={() => router.push("/offers/new")}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Create New Offer
        </Button>
      </div>

      <Card className="border-0 shadow-lg bg-white">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-gray-200 hover:bg-gray-50">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Sort
                    {sortBy !== "created_at" && (
                      <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800">
                        {sortBy.replace("_", " ")}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => handleSortChange("created_at")}
                    className="flex items-center justify-between"
                  >
                    Date Created
                    {sortBy === "created_at" && (
                      <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleSortChange("expiry_date")}
                    className="flex items-center justify-between"
                  >
                    Expiry Date
                    {sortBy === "expiry_date" && (
                      <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleSortChange("discount_percentage")}
                    className="flex items-center justify-between"
                  >
                    Discount %
                    {sortBy === "discount_percentage" && (
                      <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleSortChange("current_claims")}
                    className="flex items-center justify-between"
                  >
                    Claims
                    {sortBy === "current_claims" && (
                      <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-6">
            <form onSubmit={handleSearchSubmit} className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search offers..."
                className="pl-10 pr-10 bg-gray-50 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                value={searchTerm}
                onChange={handleSearchChange}
              />
              {searchTerm && (
                <button 
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </form>
          </div>

          {/* Status Tabs */}
          <div className="mt-6">
            <Tabs
              defaultValue={activeFilterTab}
              onValueChange={handleStatusChange}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg">
                <TabsTrigger 
                  value="all" 
                  className="data-[state=active]:bg-orange-600 data-[state=active]:text-white"
                >
                  All Offers
                </TabsTrigger>
                <TabsTrigger 
                  value="active"
                  className="data-[state=active]:bg-orange-600 data-[state=active]:text-white"
                >
                  Active
                </TabsTrigger>
                <TabsTrigger 
                  value="upcoming"
                  className="data-[state=active]:bg-orange-600 data-[state=active]:text-white"
                >
                  Upcoming
                </TabsTrigger>
                <TabsTrigger 
                  value="expired"
                  className="data-[state=active]:bg-orange-600 data-[state=active]:text-white"
                >
                  Expired
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <OfferSkeleton key={i} />
              ))}
            </div>
          ) : offers.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {offers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          )}

          {!isLoading && offers.length > 0 && renderPagination()}
        </CardContent>
      </Card>
    </BusinessLayout>
  );
}

export default function OffersPage() {
  return <OffersContent />;
}