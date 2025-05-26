"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

// Import components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  PlusCircle,
  Search,
  SlidersHorizontal,
  Tag,
  X,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StorageImage } from "@/components/ui/storage-image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function OffersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, initialized } = useAuth();

  // State variables
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [activeTab, setActiveTab] = useState("all");
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
    if (status) setActiveTab(status);
  }, [searchParams]);

  // Fetch offers data
  useEffect(() => {
    if (!initialized) return; // Wait until auth is initialized
    
    fetchOffers();
  }, [pagination.page, searchTerm, sortBy, sortOrder, activeTab, retryCount, initialized]);

  const fetchOffers = async () => {
    setIsLoading(true);
    setError("");
  
    try {
      // Build query string with parameters
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sortBy,
        sortOrder: sortOrder,
      });
  
      if (searchTerm) {
        params.append("search", searchTerm);
      }
  
      // Add status filter if not 'all'
      if (activeTab !== "all") {
        params.append("status", activeTab);
      }
  
      console.log("Fetching offers with params:", params.toString());
      const response = await fetch(
        `/api/business/offers?${params.toString()}`,
        {
          credentials: "include",
          cache: "no-store", // Prevent caching
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache"
          }
        }
      );

      // If unauthorized but we should be logged in, retry
      if (response.status === 401 && isLoggedIn && retryCount < maxRetries) {
        console.log(`Auth error detected. Retrying (${retryCount + 1}/${maxRetries})...`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 1000 * (retryCount + 1)); // Exponential backoff
        return;
      }
  
      // Parse the JSON response
      const data = await response.json();
  
      if (!response.ok) {
        // More detailed error message
        const errorMsg = data.error || `Error: ${response.status} ${response.statusText}`;
        console.error("API Error:", errorMsg, data);
        throw new Error(errorMsg);
      }
  
      // Use the already parsed data
      setOffers(data.offers || []);
      setPagination({
        page: data.pagination?.page || 1,
        limit: data.pagination?.limit || 10,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 1,
      });
    } catch (err) {
      console.error("Error fetching offers:", err);
      
      // More specific error message for unauthorized
      if (err.message.includes("Unauthorized")) {
        setError("You need to be logged in to view offers. Please sign in again.");
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1 on new search
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
    // If clicking on the same field, toggle order
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Default to descending for new sort field
      setSortBy(newSortBy);
      setSortOrder("desc");
    }

    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1 on sort change
    updateUrlParams({
      sortBy: newSortBy,
      sortOrder:
        newSortBy === sortBy ? (sortOrder === "asc" ? "desc" : "asc") : "desc",
    });
  };

  // Handle status tab change
  const handleStatusChange = (status) => {
    setActiveTab(status);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1 on status change
    updateUrlParams({ status: status === "all" ? null : status });
  };

  // Update URL parameters
  const updateUrlParams = (overrides = {}) => {
    const params = new URLSearchParams();

    // Current values
    const page =
      overrides.page !== undefined ? overrides.page : pagination.page;
    const search =
      overrides.search !== undefined ? overrides.search : searchTerm;
    const newSortBy =
      overrides.sortBy !== undefined ? overrides.sortBy : sortBy;
    const newSortOrder =
      overrides.sortOrder !== undefined ? overrides.sortOrder : sortOrder;
    const status =
      overrides.status !== undefined
        ? overrides.status
        : activeTab !== "all"
        ? activeTab
        : null;

    // Only add params that have values
    if (page > 1) params.append("page", page);
    if (search) params.append("search", search);
    if (newSortBy !== "created_at") params.append("sortBy", newSortBy);
    if (newSortOrder !== "desc") params.append("sortOrder", newSortOrder);
    if (status) params.append("status", status);

    // Update URL without reloading the page
    const newUrl = `${window.location.pathname}${
      params.toString() ? "?" + params.toString() : ""
    }`;
    window.history.pushState({}, "", newUrl);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    updateUrlParams({ page: newPage });

    // Scroll to top of the page
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
    green: "bg-green-100 text-green-800",
    yellow: "bg-yellow-100 text-yellow-800",
    destructive: "bg-red-100 text-red-800",
    gray: "bg-gray-100 text-gray-800",
  };

  // Empty state component
  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <Tag className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">No offers found</h3>
      <p className="text-muted-foreground mb-6">
        {searchTerm
          ? "Try adjusting your search or filters"
          : "Get started by creating your first offer"}
      </p>
      {searchTerm ? (
        <Button onClick={handleClearSearch}>Clear search</Button>
      ) : (
        <Button onClick={() => router.push("/business/offers/new")}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create New Offer
        </Button>
      )}
    </div>
  );

  // Loading skeleton component
  const OfferSkeleton = () => (
    <div className="border rounded-lg p-4 mb-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex space-x-3">
          <div className="w-12 h-12 bg-muted animate-pulse rounded-md"></div>
          <div className="flex-1">
            <div className="h-4 w-36 bg-muted animate-pulse rounded mb-2"></div>
            <div className="h-6 w-24 bg-muted animate-pulse rounded"></div>
          </div>
        </div>
        <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
      </div>
      <div className="flex justify-between">
        <div className="h-4 w-48 bg-muted animate-pulse rounded"></div>
        <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
      </div>
    </div>
  );

  // Offer Card component
  const OfferCard = ({ offer }) => {
    const status = getOfferStatus(offer);
    const productName = offer.products?.name || "Unknown Product";
    const productPrice = offer.products?.price || 0;
    const discountAmount = (
      (productPrice * offer.discount_percentage) /
      100
    ).toFixed(2);
    const finalPrice = (productPrice - discountAmount).toFixed(2);

    return (
      <div
        className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => router.push(`/business/offers/${offer.id}`)}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                <StorageImage
                  path={offer.products?.image_url}
                  alt={productName}
                  className="w-full h-full object-cover"
                  fallbackSize="48x48"
                  emptyIcon={<Tag className="h-6 w-6 text-gray-300" />}
                />
              </div>
              <div>
                <h3 className="font-medium">{productName}</h3>
                <p className="text-lg font-bold text-blue-600">
                  {offer.discount_percentage}% Off
                </p>
              </div>
            </div>
            <Badge className={statusColors[status.color]}>{status.label}</Badge>
          </div>

          <div className="flex justify-between text-sm">
            <div>
              <p className="text-gray-500">
                {formatDate(offer.start_date)} - {formatDate(offer.expiry_date)}
              </p>
              {offer.discount_code && (
                <p className="text-gray-600 mt-1">
                  Code:{" "}
                  <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">
                    {offer.discount_code}
                  </span>
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-gray-500">
                Original: {formatPrice(productPrice)}
              </p>
              <p className="text-green-600">Now: {formatPrice(finalPrice)}</p>
            </div>
          </div>

          {offer.max_claims !== null && (
            <div className="mt-2 pt-2 border-t flex justify-between text-xs text-gray-500">
              <span>
                Claims: {offer.current_claims} / {offer.max_claims}
              </span>
              <span>
                {Math.round((offer.current_claims / offer.max_claims) * 100)}%
                claimed
              </span>
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
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-muted-foreground">
          Showing {(pagination.page - 1) * pagination.limit + 1}
          {pagination.page * pagination.limit < pagination.total
            ? ` - ${pagination.page * pagination.limit}`
            : ""}{" "}
          of {pagination.total} offers
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {renderPageNumbers()}
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
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
    const maxVisible = 5; // Maximum number of page buttons to show

    let startPage = Math.max(1, pagination.page - Math.floor(maxVisible / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);

    // Adjust start if we're near the end
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <Button
          key={i}
          variant={pagination.page === i ? "default" : "outline"}
          size="icon"
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      );
    }

    return pageNumbers;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Offers & Discounts
          </h1>
          <p className="text-muted-foreground">
            Manage special offers and discounts for your products
          </p>
        </div>
        <Button
          onClick={() => router.push("/business/offers/new")}
          className="w-full md:w-auto"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Create New Offer
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Your Offers</CardTitle>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-auto" size="sm">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Sort
                    {sortBy !== "created_at" && (
                      <Badge variant="secondary" className="ml-2 capitalize">
                        {sortBy.replace("_", " ")}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleSortChange("created_at")}
                    className="flex items-center justify-between"
                  >
                    Date Created
                    {sortBy === "created_at" && (
                      <Badge variant="secondary" className="ml-2">
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
                      <Badge variant="secondary" className="ml-2">
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
                      <Badge variant="secondary" className="ml-2">
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
                      <Badge variant="secondary" className="ml-2">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mt-4">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search offers..."
                className="pl-10 pr-10"
                value={searchTerm}
                onChange={handleSearchChange}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </form>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue={activeTab}
            onValueChange={handleStatusChange}
            className="mb-6"
          >
            <TabsList>
              <TabsTrigger value="all">All Offers</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="expired">Expired</TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <OfferSkeleton key={i} />
              ))}
            </div>
          ) : offers.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          )}

          {!isLoading && offers.length > 0 && renderPagination()}
        </CardContent>
      </Card>
    </div>
  );
}