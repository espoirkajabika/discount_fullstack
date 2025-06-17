import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/AuthContext';
import { useRedemption } from '@/hooks/useRedemption';
import { 
  Camera, 
  CheckCircle, 
  AlertCircle,
  User,
  ShoppingBag,
  Tag,
  DollarSign,
  Clock,
  KeyRound,
  Loader2,
  RefreshCw,
  Search,
  Gift,
  TrendingUp,
  QrCode,
  Calendar,
  ArrowUpRight,
  Eye,
  FileText,
  Target
} from 'lucide-react';

// Enhanced Manual Entry Component
const ClaimInput = ({ onVerify, isVerifying }) => {
  const [claimId, setClaimId] = useState('');

  const handleSubmit = () => {
    if (claimId.trim()) {
      onVerify(claimId.trim());
      setClaimId('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="claim-id" className="text-sm font-medium">Customer Claim ID</Label>
        <div className="flex gap-2">
          <Input
            id="claim-id"
            type="text"
            placeholder="e.g., AQ51HP87"
            value={claimId}
            onChange={(e) => setClaimId(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            className="font-mono text-lg flex-1"
            autoFocus
            disabled={isVerifying}
          />
          <Button 
            onClick={handleSubmit}
            disabled={!claimId.trim() || isVerifying}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isVerifying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <Alert className="border-gray-200 bg-gray-50">
        <QrCode className="h-4 w-4" />
        <AlertDescription className="text-sm text-gray-600">
          Ask the customer for their claim ID or scan their QR code
        </AlertDescription>
      </Alert>

      <Separator />

      {/* Quick Actions */}
      <div className="space-y-3">
        <Label className="text-xs text-gray-500">Quick Actions</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="text-xs border-green-200 hover:bg-green-50">
            <Camera className="h-3 w-3 mr-1" />
            Scan QR
          </Button>
          <Button variant="outline" size="sm" className="text-xs border-blue-200 hover:bg-blue-50">
            <TrendingUp className="h-3 w-3 mr-1" />
            Stats
          </Button>
        </div>
      </div>
    </div>
  );
};

// Dynamic Today's Activity Component
const TodaysActivity = () => {
  const { getRedemptionStats } = useRedemption();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTodaysStats = async () => {
      setLoading(true);
      try {
        const result = await getRedemptionStats(1); // Get today's stats (1 day)
        if (result.success) {
          setStats(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('Failed to load today\'s stats');
      } finally {
        setLoading(false);
      }
    };

    fetchTodaysStats();
  }, [getRedemptionStats]);

  if (loading) {
    return (
      <Card className="border-0 bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Today's Activity</CardTitle>
          <CardDescription>Loading statistics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Today's Activity</CardTitle>
          <CardDescription>Error loading stats</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Today's Activity
        </CardTitle>
        <CardDescription>Real-time redemption statistics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">
              {stats?.total_redemptions || 0}
            </div>
            <Label className="text-xs text-green-700">Redeemed</Label>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">
              ${stats?.total_savings_provided?.toFixed(2) || '0.00'}
            </div>
            <Label className="text-xs text-blue-700">Savings</Label>
          </div>
        </div>
        
        {stats && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Redemption Rate:</span>
              <Badge variant="outline" className="text-xs">
                {stats.redemption_rate}%
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Redemption History Component
const RedemptionHistory = () => {
  const { getRedemptionHistory } = useRedemption();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState(null);
  const [summary, setSummary] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchHistory = async (page = 1) => {
    setLoading(true);
    try {
      const result = await getRedemptionHistory({ 
        page, 
        limit: 10,
        redeemed_only: true 
      });
      
      if (result.success) {
        setHistory(result.data.redemptions || []);
        setPagination(result.data.pagination);
        setSummary(result.data.summary);
        setCurrentPage(page);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load redemption history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDiscount = (offer) => {
    if (offer.discount_type === 'percentage') {
      return `${offer.discount_value}% off`;
    }
    return `$${offer.discount_value} off`;
  };

  if (loading && history.length === 0) {
    return (
      <Card className="border-0 bg-white shadow-lg h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Recent Redemptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 bg-white shadow-lg h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Recent Redemptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-white shadow-lg h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Recent Redemptions
            </CardTitle>
            <CardDescription>
              {summary && `${summary.redeemed_claims} of ${summary.total_claims} claims redeemed`}
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchHistory(currentPage)}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No redemptions yet</h3>
            <p className="text-gray-500">Recent redemptions will appear here</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {history.map((redemption) => (
                <Card key={redemption.id} className="border border-gray-200 hover:border-green-300 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            variant={redemption.is_redeemed ? "default" : "secondary"}
                            className={redemption.is_redeemed ? "bg-green-100 text-green-800" : ""}
                          >
                            {redemption.is_redeemed ? "Redeemed" : "Pending"}
                          </Badge>
                          {redemption.claim_id && (
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {redemption.claim_id}
                            </code>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {redemption.customer.name}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Gift className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-700">
                              {redemption.offer.title}
                            </span>
                          </div>
                          
                          {redemption.offer.discount_type && (
                            <div className="flex items-center gap-2">
                              <Tag className="h-4 w-4 text-gray-400" />
                              <Badge variant="outline" className="text-xs">
                                {formatDiscount(redemption.offer)}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {redemption.is_redeemed 
                            ? formatDate(redemption.redeemed_at)
                            : formatDate(redemption.claimed_at)
                          }
                        </div>
                        {redemption.offer.savings_amount && (
                          <div className="text-sm font-medium text-green-600">
                            ${redemption.offer.savings_amount.toFixed(2)} saved
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {redemption.redemption_notes && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-600 italic">
                          "{redemption.redemption_notes}"
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
        
        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.total_pages}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchHistory(currentPage - 1)}
                disabled={!pagination.has_prev || loading}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchHistory(currentPage + 1)}
                disabled={!pagination.has_next || loading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
        
        {/* Summary Stats */}
        {summary && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-gray-900">{summary.total_claims}</div>
                <div className="text-xs text-gray-500">Total Claims</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-green-600">{summary.redeemed_claims}</div>
                <div className="text-xs text-gray-500">Redeemed</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-blue-600">
                  ${summary.total_savings_provided?.toFixed(2) || '0.00'}
                </div>
                <div className="text-xs text-gray-500">Total Savings</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Enhanced Claim Details Display Component (for when verifying a new claim)
const ClaimDetailsCard = ({ claimDetails, onRedeem, isRedeeming }) => {
  const [notes, setNotes] = useState('');

  const handleRedeem = () => {
    onRedeem(claimDetails.claim_id, notes);
  };

  const formatDiscount = (discount) => {
    if (discount.discount_type === 'percentage') {
      return `${discount.discount_value}% OFF`;
    } else {
      return `$${discount.discount_value} OFF`;
    }
  };

  const calculateSavings = (discount) => {
    if (discount.discount_type === 'percentage' && discount.original_price) {
      return (discount.original_price * discount.discount_value / 100).toFixed(2);
    }
    return discount.discount_value?.toFixed(2) || '0.00';
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 p-1">
        {/* Customer Info */}
        <Card className="border-blue-200 bg-blue-50 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <User className="h-5 w-5 text-blue-600" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <p className="font-semibold text-blue-900 text-lg">
                {claimDetails.customer.name}
              </p>
              {claimDetails.customer.email && (
                <p className="text-sm text-blue-700">{claimDetails.customer.email}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Offer Details */}
        <Card className="border-yellow-200 bg-yellow-50 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-yellow-900">
              <Gift className="h-5 w-5 text-yellow-600" />
              Offer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div>
              <h3 className="font-semibold text-yellow-900 text-lg mb-2">
                {claimDetails.offer.title}
              </h3>
              {claimDetails.offer.description && (
                <p className="text-sm text-yellow-700 mb-3">{claimDetails.offer.description}</p>
              )}
            </div>
            
            {claimDetails.offer.product_name && (
              <div className="flex items-center gap-2 p-2 bg-yellow-100 rounded-md">
                <ShoppingBag className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  {claimDetails.offer.product_name}
                </span>
              </div>
            )}
            
            <div className="flex justify-start">
              <Badge className="bg-yellow-200 text-yellow-800 border-yellow-300 text-sm px-3 py-1">
                {formatDiscount(claimDetails.discount_info)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Breakdown */}
        <Card className="border-green-200 bg-green-50 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <DollarSign className="h-5 w-5 text-green-600" />
              Price Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {claimDetails.discount_info.original_price ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-green-700">Original Price:</span>
                  <span className="font-mono text-lg line-through text-gray-500">
                    ${claimDetails.discount_info.original_price.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-700">Final Price:</span>
                  <span className="font-mono text-xl font-bold text-green-800">
                    ${claimDetails.discount_info.discounted_price.toFixed(2)}
                  </span>
                </div>
                
                <Separator className="bg-green-200" />
                
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-green-900">Customer Saves:</span>
                  <Badge variant="secondary" className="bg-green-200 text-green-800 font-mono text-lg">
                    ${calculateSavings(claimDetails.discount_info)}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-center p-4">
                <Badge className="bg-green-200 text-green-800 border-green-300 text-lg px-4 py-2">
                  {formatDiscount(claimDetails.discount_info)}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Claim Information */}
        <Card className="border-gray-200 bg-gray-50 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Clock className="h-5 w-5 text-gray-600" />
              Claim Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Claim ID</Label>
                <p className="font-mono font-semibold text-gray-900">{claimDetails.claim_id}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Type</Label>
                <div>
                  <Badge variant="outline" className="text-xs">
                    {claimDetails.claim_type === 'in_store' ? 'In-Store' : 'Online'}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label className="text-sm text-gray-600">Claimed At</Label>
                <p className="text-sm text-gray-900">
                  {new Date(claimDetails.claimed_at).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Redemption Notes */}
        <Card className="border-gray-200 bg-white shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-900">Redemption Notes</CardTitle>
            <CardDescription>Add any notes about this redemption (optional)</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Textarea
              placeholder="Add any notes about this redemption..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={isRedeeming}
              className="resize-none"
            />
          </CardContent>
        </Card>

        {/* Redeem Button */}
        <Button 
          onClick={handleRedeem}
          disabled={isRedeeming}
          className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg"
          size="lg"
        >
          {isRedeeming ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Processing Redemption...
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 mr-2" />
              Complete Redemption
            </>
          )}
        </Button>
      </div>
    </ScrollArea>
  );
};

// Main Dashboard Component
const RedeemDashboard = () => {
  const { user } = useAuth();
  const {
    isVerifying,
    isRedeeming,
    claimDetails,
    error,
    success,
    verifyClaim,
    redeemClaim,
    reset,
    clearMessages,
    hasClaimDetails,
    canRetry
  } = useRedemption();

  // Authentication checks
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Alert className="max-w-md border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Please log in to access the redemption dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!user.is_business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-4">
        <Alert className="max-w-md border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Business account required to access redemption features.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleVerify = async (claimId) => {
    clearMessages();
    await verifyClaim(claimId, 'claim_id');
  };

  const handleRedeem = async (claimId, notes) => {
    await redeemClaim(claimId, notes);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Redeem Customer Offers
              </h1>
              <p className="text-gray-600">
                Verify and process customer redemptions in real-time
              </p>
            </div>
            
            {hasClaimDetails && (
              <Button 
                variant="outline" 
                onClick={reset} 
                className="mt-4 sm:mt-0 flex items-center gap-2 border-green-200 hover:bg-green-50"
              >
                <RefreshCw className="h-4 w-4" />
                New Claim
              </Button>
            )}
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <div className="flex-1">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
                {canRetry && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearMessages}
                    className="mt-2 border-red-200 text-red-700 hover:bg-red-50"
                  >
                    Try Again
                  </Button>
                )}
              </div>
            </div>
          </Alert>
        )}

        {/* Loading State */}
        {isVerifying && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
            <AlertDescription className="text-blue-800">Verifying claim...</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-0 bg-white shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5" />
                  Claim Verification
                </CardTitle>
                <CardDescription className="text-green-100">
                  Enter customer claim ID to verify offer
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <ClaimInput 
                  onVerify={handleVerify}
                  isVerifying={isVerifying}
                />
              </CardContent>
            </Card>

            {/* Quick Guide */}
            <Card className="border-0 bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Quick Guide</CardTitle>
                <CardDescription>Step-by-step redemption process</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Badge variant="secondary" className="w-6 h-6 rounded-full flex items-center justify-center p-0 text-xs">
                      1
                    </Badge>
                    <span>Ask customer for claim ID</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Badge variant="secondary" className="w-6 h-6 rounded-full flex items-center justify-center p-0 text-xs">
                      2
                    </Badge>
                    <span>Enter claim ID above</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Badge variant="secondary" className="w-6 h-6 rounded-full flex items-center justify-center p-0 text-xs">
                      3
                    </Badge>
                    <span>Review offer details</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Badge variant="secondary" className="w-6 h-6 rounded-full flex items-center justify-center p-0 text-xs">
                      4
                    </Badge>
                    <span>Complete redemption</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dynamic Today's Activity */}
            <TodaysActivity />
          </div>

          {/* Main Content Section */}
          <div className="lg:col-span-2">
            {hasClaimDetails ? (
              <Card className="border-0 bg-white shadow-lg h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Valid Claim Found
                  </CardTitle>
                  <CardDescription>
                    Review the details below and complete the redemption
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 h-full">
                  <ClaimDetailsCard 
                    claimDetails={claimDetails}
                    onRedeem={handleRedeem}
                    isRedeeming={isRedeeming}
                  />
                </CardContent>
              </Card>
            ) : (
              /* Redemption History when no claim is being verified */
              <RedemptionHistory />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedeemDashboard;