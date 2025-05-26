'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/CustomerAuthContext';

// UI Components
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Icons
import { CheckCircle, Ticket, Loader2, AlertCircle } from 'lucide-react';

export function ClaimOfferButton({ offerId, offerDetails, className = '', variant = 'default' }) {
  const router = useRouter();
  const { isLoggedIn, isInitialized, user } = useAuth();
  
  // State variables
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [claimDetails, setClaimDetails] = useState(null);
  const [authVerified, setAuthVerified] = useState(false);

  // Verify authentication is actually working
  useEffect(() => {
    if (isInitialized && isLoggedIn && user) {
      setAuthVerified(true);
    } else {
      setAuthVerified(false);
    }
  }, [isInitialized, isLoggedIn, user]);
  
  // Handle claim offer click
  const handleClaimClick = async () => {
    // Check if auth is verified
    if (!authVerified) {
      console.log("Auth not verified. isLoggedIn:", isLoggedIn, "isInitialized:", isInitialized, "user:", !!user);
      setShowLoginPrompt(true);
      return;
    }
    
    // Proceed with claiming the offer
    await claimOffer();
  };
  
  // Claim offer function
  const claimOffer = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log(`Claiming offer ${offerId}...`);
      
      const response = await fetch(`/api/customer/offers/${offerId}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for auth
      });
      
      console.log(`Claim response status: ${response.status}`);
      
      // Parse the response data
      let data = null;
      let responseText = '';
      
      try {
        responseText = await response.text();
        console.log("Response text length:", responseText?.length || 0);
        data = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.error('Error parsing response:', e);
        console.error('Response text:', responseText);
        throw new Error('Failed to parse server response');
      }
      
      // Check if the response is OK
      if (!response.ok) {
        // Extract error message from data or use status text
        const errorMessage = data?.error || response.statusText || 'Failed to claim offer';
        // Specific handling for 401 errors
        if (response.status === 401) {
          console.error('Authentication required. User not properly authenticated.');
          setError('You need to be logged in to claim this offer');
          setShowLoginPrompt(true);
          return;
        }
        throw new Error(errorMessage);
      }
      
      console.log("Claim successful:", data);
      
      // If already claimed, go directly to the claimed offer
      if (data.claimed && data.claimData) {
        router.push(`/customer/claimed/${data.claimData.id}`);
        return;
      }
      
      // Otherwise, show success dialog
      setClaimDetails(data.claimData);
      setShowSuccess(true);
    } catch (error) {
      console.error('Error claiming offer:', error);
      setError(error.message || 'Something went wrong');
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle redirect to claimed offer detail
  const handleViewClaimedOffer = () => {
    if (claimDetails?.id) {
      router.push(`/customer/claimed/${claimDetails.id}`);
    } else {
      router.push('/customer/claimed');
    }
  };
  
  // Handle login redirect
  const handleLoginRedirect = () => {
    router.push(`/customer/auth/login?redirect=/customer/offers/${offerId}`);
  };
  
  // Render button
  return (
    <>
      <Button 
        className={className}
        variant={variant}
        onClick={handleClaimClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Claiming...
          </>
        ) : (
          <>Claim This Offer</>
        )}
      </Button>
      
      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Offer Claimed Successfully!</DialogTitle>
            <DialogDescription>
              You have successfully claimed this offer. You can view the details and redemption code in your claimed offers.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center py-4">
            <div className="text-center mb-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              
              <h3 className="text-lg font-semibold mb-1">
                {offerDetails?.discount_percentage}% Off {offerDetails?.products?.name}
              </h3>
              <p className="text-gray-500">at {offerDetails?.business?.business_name}</p>
            </div>
            
            {claimDetails?.redemption_code && (
              <div className="bg-gray-100 p-4 rounded-md w-full text-center">
                <p className="text-sm text-gray-600 mb-1">Redemption Code</p>
                <p className="font-mono text-lg font-bold">{claimDetails.redemption_code}</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSuccess(false)}
            >
              Close
            </Button>
            <Button onClick={handleViewClaimedOffer}>
              <Ticket className="mr-2 h-4 w-4" />
              View Claimed Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Error Dialog */}
      <Dialog open={showError} onOpenChange={setShowError}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <DialogTitle>Error Claiming Offer</DialogTitle>
            </div>
            <DialogDescription>
              {error || "There was a problem claiming this offer. Please try again."}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowError(false)}
            >
              Close
            </Button>
            {error && error.includes('logged in') && (
              <Button onClick={handleLoginRedirect}>
                Log In
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Login Prompt Alert Dialog */}
      <AlertDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Login Required</AlertDialogTitle>
            <AlertDialogDescription>
              You need to be logged in to claim this offer. Would you like to log in now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLoginRedirect}>
              Log In
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}