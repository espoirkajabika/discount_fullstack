import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Search
} from 'lucide-react';

// Simple Manual Entry Component
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
        <Label htmlFor="claim-id">Customer Claim ID</Label>
        <div className="flex gap-2">
          <Input
            id="claim-id"
            type="text"
            placeholder="Enter claim ID (e.g., AQ51HP87)"
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
          >
            {isVerifying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="text-center text-sm text-gray-500">
        Ask the customer for their claim ID or QR code
      </div>
    </div>
  );
};

// Claim Details Display Component
const ClaimDetailsCard = ({ claimDetails, onRedeem, isRedeeming }) => {
  const [notes, setNotes] = useState('');

  const handleRedeem = () => {
    onRedeem(claimDetails.claim_id, notes);
  };

  const formatDiscount = (discount) => {
    if (discount.discount_type === 'percentage') {
      return `${discount.discount_value}% off`;
    } else {
      return `$${discount.discount_value} off`;
    }
  };

  const calculateSavings = (discount) => {
    if (discount.discount_type === 'percentage' && discount.original_price) {
      return (discount.original_price * discount.discount_value / 100).toFixed(2);
    }
    return discount.discount_value?.toFixed(2) || '0.00';
  };

  return (
    <div className="space-y-6">
      {/* Customer Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Customer</span>
          </div>
          <p className="font-semibold text-blue-900">{claimDetails.customer.name}</p>
          {claimDetails.customer.email && (
            <p className="text-sm text-blue-700">{claimDetails.customer.email}</p>
          )}
        </CardContent>
      </Card>

      {/* Offer Details */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">Offer</span>
          </div>
          <p className="font-semibold text-green-900">{claimDetails.offer.title}</p>
          {claimDetails.offer.description && (
            <p className="text-sm text-green-700 mt-1">{claimDetails.offer.description}</p>
          )}
          {claimDetails.offer.product_name && (
            <div className="flex items-center gap-1 mt-2">
              <ShoppingBag className="h-3 w-3 text-green-600" />
              <span className="text-sm text-green-700">{claimDetails.offer.product_name}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Discount Information */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-900">Discount</span>
            </div>
            <Badge className="bg-yellow-200 text-yellow-800 border-yellow-300">
              {formatDiscount(claimDetails.discount_info)}
            </Badge>
          </div>
          
          {claimDetails.discount_info.original_price && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-yellow-700">Original:</span>
                <span className="font-mono">${claimDetails.discount_info.original_price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-yellow-700">Discounted:</span>
                <span className="font-mono font-semibold">${claimDetails.discount_info.discounted_price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-yellow-200 pt-1">
                <span className="text-yellow-900">Customer Saves:</span>
                <span className="font-mono text-green-700">${calculateSavings(claimDetails.discount_info)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Claim Info */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-900">Claim Details</span>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Claim ID:</span>
            <span className="font-mono font-semibold">{claimDetails.claim_id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Type:</span>
            <Badge variant="outline" className="text-xs">
              {claimDetails.claim_type === 'in_store' ? 'In-Store' : 'Online'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Claimed:</span>
            <span className="text-xs">{new Date(claimDetails.claimed_at).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Redemption Notes */}
      <div className="space-y-2">
        <Label htmlFor="redemption-notes">Redemption Notes (Optional)</Label>
        <Textarea
          id="redemption-notes"
          placeholder="Add any notes about this redemption..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          disabled={isRedeeming}
        />
      </div>

      {/* Redeem Button */}
      <Button 
        onClick={handleRedeem}
        disabled={isRedeeming}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
        size="lg"
      >
        {isRedeeming ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing Redemption...
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            Complete Redemption
          </>
        )}
      </Button>
    </div>
  );
};

// Main Dashboard Component
const RedeemOfferDashboard = () => {
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Redeem Customer Offers</h1>
              <p className="text-gray-600">Enter claim IDs to verify and redeem customer offers</p>
            </div>
            
            {hasClaimDetails && (
              <Button variant="outline" onClick={reset} className="flex items-center gap-2">
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
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5" />
                  Claim Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ClaimInput 
                  onVerify={handleVerify}
                  isVerifying={isVerifying}
                />
              </CardContent>
            </Card>

            {/* Quick Instructions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Quick Guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <span>Ask customer for claim ID</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <span>Enter claim ID above</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <span>Review offer details</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</div>
                    <span>Complete redemption</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Claim Details Section */}
          <div className="lg:col-span-2">
            {hasClaimDetails ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Valid Claim Found
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ClaimDetailsCard 
                    claimDetails={claimDetails}
                    onRedeem={handleRedeem}
                    isRedeeming={isRedeeming}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full">
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Verify Claims</h3>
                    <p className="text-gray-500 mb-4">Enter a customer's claim ID to get started</p>
                    <div className="bg-gray-50 rounded-lg p-3 text-left max-w-sm mx-auto">
                      <p className="text-sm text-gray-600 mb-1">Example claim IDs:</p>
                      <div className="space-y-1">
                        <code className="text-xs bg-white px-2 py-1 rounded border block">AQ51HP87</code>
                        <code className="text-xs bg-white px-2 py-1 rounded border block">BX92KD14</code>
                        <code className="text-xs bg-white px-2 py-1 rounded border block">CY73MF56</code>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedeemOfferDashboard;