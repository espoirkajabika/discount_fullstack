// Create this file: discount_biz/components/RedemptionInterface.js
'use client';

import { useState } from 'react';
import { QrCode, Keyboard, CheckCircle, XCircle, Clock, User, Tag, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import QRScanner from './QRScanner';

export default function RedemptionInterface() {
  const [showScanner, setShowScanner] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [redemptionResult, setRedemptionResult] = useState(null);
  const [error, setError] = useState(null);
  const [manualClaimId, setManualClaimId] = useState('');

  // Reset state
  const resetState = () => {
    setVerificationResult(null);
    setRedemptionResult(null);
    setError(null);
    setManualClaimId('');
  };

  // Verify claim with API
  const verifyClaim = async (claimIdentifier, verificationType) => {
    setIsVerifying(true);
    setError(null);
    
    try {
      const response = await fetch('/api/v1/business/redeem/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          claim_identifier: claimIdentifier,
          verification_type: verificationType
        })
      });

      const result = await response.json();

      if (response.ok && result.is_valid) {
        setVerificationResult(result);
        setError(null);
      } else {
        setError(result.error_message || 'Claim verification failed');
        setVerificationResult(null);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Network error. Please check your connection and try again.');
      setVerificationResult(null);
    } finally {
      setIsVerifying(false);
    }
  };

  // Complete redemption
  const completeRedemption = async (claimId, notes = '') => {
    setIsRedeeming(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/business/redeem/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          claim_id: claimId,
          redemption_notes: notes
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setRedemptionResult(result);
        setVerificationResult(null);
        setError(null);
      } else {
        setError(result.message || 'Redemption failed');
      }
    } catch (error) {
      console.error('Redemption error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsRedeeming(false);
    }
  };

  // Handle scan result
  const handleScanResult = (scannedData, scanType) => {
    console.log('Scanned:', scannedData, 'Type:', scanType);
    setShowScanner(false);
    verifyClaim(scannedData, scanType === 'qr_code' ? 'qr_code' : 'claim_id');
  };

  // Handle manual claim ID submission
  const handleManualSubmit = () => {
    if (manualClaimId.trim()) {
      verifyClaim(manualClaimId.trim(), 'claim_id');
    }
    
  };

  // Start new redemption process
  const startNewRedemption = () => {
    resetState();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Redeem Customer Offers</h1>
        <p className="text-gray-600">Scan QR codes or enter claim IDs to redeem customer offers</p>
      </div>

      {/* Success State - Redemption Complete */}
      {redemptionResult && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-green-800">Redemption Successful! 🎉</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Customer:</span>
                <span>{redemptionResult.redemption_details?.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Offer:</span>
                <span>{redemptionResult.redemption_details?.offer_title}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Claim ID:</span>
                <span className="font-mono">{redemptionResult.redemption_details?.claim_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Redeemed:</span>
                <span>{new Date(redemptionResult.redemption_details?.redeemed_at).toLocaleString()}</span>
              </div>
            </div>
            
            <Button 
              onClick={startNewRedemption}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Redeem Another Offer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Verification Result - Ready to Redeem */}
      {verificationResult && !redemptionResult && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Claim Verified - Ready to Redeem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Customer Info */}
            <div className="bg-white rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Customer Information
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{verificationResult.claim_details?.customer?.name}</span>
                </div>
                {verificationResult.claim_details?.customer?.email && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{verificationResult.claim_details?.customer?.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Offer Details */}
            <div className="bg-white rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center">
                <Tag className="w-4 h-4 mr-2" />
                Offer Details
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-600">Offer:</span>
                  <p className="font-medium">{verificationResult.claim_details?.offer?.title}</p>
                </div>
                {verificationResult.claim_details?.offer?.description && (
                  <div>
                    <span className="text-gray-600">Description:</span>
                    <p className="text-sm">{verificationResult.claim_details?.offer?.description}</p>
                  </div>
                )}
                {verificationResult.claim_details?.offer?.product_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Product:</span>
                    <span className="font-medium">{verificationResult.claim_details?.offer?.product_name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Discount Information */}
            <div className="bg-white rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Discount Information
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Discount:</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {verificationResult.claim_details?.discount_info?.discount_text}
                  </Badge>
                </div>
                {verificationResult.claim_details?.discount_info?.original_price > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Original Price:</span>
                      <span>${verificationResult.claim_details?.discount_info?.original_price?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discounted Price:</span>
                      <span className="font-bold text-green-600">
                        ${verificationResult.claim_details?.discount_info?.discounted_price?.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Claim Details */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Claim ID:</span>
                <span className="font-mono">{verificationResult.claim_details?.claim_id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Claimed:</span>
                <span>{new Date(verificationResult.claim_details?.claimed_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Type:</span>
                <Badge variant="outline" className="text-xs">
                  {verificationResult.claim_details?.claim_type === 'in_store' ? 'In-Store' : 'Online'}
                </Badge>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={startNewRedemption}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => completeRedemption(verificationResult.claim_details?.claim_id)}
                disabled={isRedeeming}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isRedeeming ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Redeeming...
                  </>
                ) : (
                  'Complete Redemption'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Initial State - Scan Options */}
      {!verificationResult && !redemptionResult && !isVerifying && (
        <Card>
          <CardHeader>
            <CardTitle>How would you like to redeem?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* QR Code Scanner Option */}
            <Button
              onClick={() => setShowScanner(true)}
              className="w-full h-16 bg-green-600 hover:bg-green-700 text-lg"
            >
              <QrCode className="w-6 h-6 mr-3" />
              Scan QR Code
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Manual Entry Option */}
            <div className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={manualClaimId}
                  onChange={(e) => setManualClaimId(e.target.value.toUpperCase())}
                  placeholder="Enter Claim ID (e.g., ABC12345)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleManualSubmit();
                    }
                  }}
                />
                <Button 
                  onClick={handleManualSubmit}
                  disabled={!manualClaimId.trim()}
                  variant="outline"
                  className="px-6"
                >
                  <Keyboard className="w-4 h-4 mr-2" />
                  Verify
                </Button>
              </div>
              <p className="text-sm text-gray-500 text-center">
                Customer can provide the claim ID if QR code doesn't work
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isVerifying && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Clock className="w-8 h-8 mx-auto mb-4 animate-spin text-green-600" />
              <p className="text-lg font-medium">Verifying claim...</p>
              <p className="text-sm text-gray-500">Please wait while we validate the offer</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          isActive={showScanner}
          onScan={handleScanResult}
          onError={(error) => {
            console.error('Scanner error:', error);
            setError('QR scanner error: ' + error.message);
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
          showManualEntry={true}
        />
      )}
    </div>
  );
}