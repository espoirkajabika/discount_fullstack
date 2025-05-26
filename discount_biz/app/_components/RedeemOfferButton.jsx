'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export function RedeemOfferButton({ claimId, onSuccess, className, disabled = false, variant = 'default' }) {
  const router = useRouter();
  
  // State variables
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Handle redeem button click
  const handleRedeemClick = () => {
    setShowConfirmDialog(true);
  };
  
  // Handle confirm redemption
  const handleConfirmRedeem = async () => {
    setShowConfirmDialog(false);
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/customer/claimed-offers/${claimId}/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to redeem offer');
      }
      
      setShowSuccessDialog(true);
      
      // Call onSuccess callback if provided
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess(data.redeemedOffer);
      }
    } catch (error) {
      console.error('Error redeeming offer:', error);
      setErrorMessage(error.message || 'Something went wrong');
      setShowErrorDialog(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle dialog close and refresh
  const handleSuccessContinue = () => {
    setShowSuccessDialog(false);
    router.refresh();
  };
  
  return (
    <>
      <Button 
        variant={variant}
        className={className}
        onClick={handleRedeemClick}
        disabled={disabled || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>Mark as Redeemed</>
        )}
      </Button>
      
      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Redemption</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this offer as redeemed? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRedeem}>
              Confirm Redemption
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
              <AlertDialogTitle>Offer Redeemed Successfully</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              This offer has been marked as redeemed. Thank you for using SaverSpot!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleSuccessContinue}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Error Dialog */}
      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center">
              <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
              <AlertDialogTitle>Error</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              {errorMessage || 'Failed to redeem offer. Please try again.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowErrorDialog(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}