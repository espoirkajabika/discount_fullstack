'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/context/CustomerAuthContext';
import { useRouter } from 'next/navigation';

// UI Components
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StorageImage } from '@/components/ui/storage-image';
import { 
  Heart, 
  Tag,
  Clock,
  Store,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Toast component for feedback
import { useToast } from '@/components/ui/use-toast';

export default function OfferCard({ offer, size = 'medium', showSaveButton = true, className = '' }) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { toast } = useToast();
  
  const [isSaved, setIsSaved] = useState(offer.user?.isSaved || false);
  const [isSaving, setIsSaving] = useState(false);

  // Format price with currency symbol
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  // Calculate discounted price
  const calculateDiscountedPrice = () => {
    if (!offer.products?.price && !offer.calculated?.originalPrice) return null;
    
    const originalPrice = offer.calculated?.originalPrice || offer.products.price;
    const discountAmount = originalPrice * (offer.discount_percentage / 100);
    return originalPrice - discountAmount;
  };

  // Calculate days remaining until expiry
  const getDaysRemaining = () => {
    const expiryDate = new Date(offer.expiry_date);
    const now = new Date();
    const diffTime = expiryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Handle save offer
  const handleSaveOffer = async (e) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation(); // Prevent event bubbling
    
    if (!isLoggedIn) {
      // Redirect to login page
      router.push(`/customer/auth/login?redirect=/customer/offers/${offer.id}`);
      return;
    }
    
    setIsSaving(true);
    
    try {
      if (isSaved) {
        // Unsave offer
        const response = await fetch(`/api/customer/offers/${offer.id}/unsave`, {
          method: 'DELETE',
          credentials: 'include'
        });
        
        if (response.ok) {
          setIsSaved(false);
          toast({
            description: "Offer removed from your saved list",
          });
        } else {
          throw new Error('Failed to remove from saved offers');
        }
      } else {
        // Save offer
        const response = await fetch(`/api/customer/offers/${offer.id}/save`, {
          method: 'POST',
          credentials: 'include'
        });
        
        if (response.ok) {
          setIsSaved(true);
          toast({
            description: "Offer saved to your favorites!",
          });
        } else {
          throw new Error('Failed to save offer');
        }
      }
    } catch (error) {
      console.error('Error saving/unsaving offer:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update saved offers. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const originalPrice = offer.calculated?.originalPrice || offer.products?.price;
  const finalPrice = calculateDiscountedPrice();
  const businessName = offer.business?.business_name || offer.products?.business?.business_name;
  const productName = offer.products?.name;
  const daysRemaining = getDaysRemaining();

  // Size-dependent classes
  const sizeClasses = {
    small: {
      card: 'hover:shadow-sm',
      image: 'h-28',
      title: 'text-sm font-medium line-clamp-1'
    },
    medium: {
      card: 'hover:shadow-md',
      image: 'h-44',
      title: 'text-base font-semibold line-clamp-2'
    },
    large: {
      card: 'hover:shadow-lg',
      image: 'h-56',
      title: 'text-lg font-bold line-clamp-2'
    }
  };

  return (
    <Link href={`/customer/offers/${offer.id}`} className={className}>
      <Card className={cn(`overflow-hidden h-full transition-shadow ${sizeClasses[size].card}`, className)}>
        <div className={`relative bg-gray-100 flex items-center justify-center ${sizeClasses[size].image}`}>
          {/* Discount badge */}
          <div className="absolute top-2 right-2 bg-red-500 text-white font-bold px-2 py-1 rounded-md text-sm">
            {offer.discount_percentage}% OFF
          </div>
          
          {/* Save button */}
          {showSaveButton && (
            <Button
              size="icon"
              variant="ghost"
              className={`absolute top-2 left-2 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm ${isSaved ? 'text-red-500' : 'text-gray-500'} hover:bg-white`}
              onClick={handleSaveOffer}
              disabled={isSaving}
            >
              <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
            </Button>
          )}
          
          {/* Product image */}
          <StorageImage
            path={offer.products?.image_url}
            alt={productName || 'Product image'}
            className="w-full h-full object-cover"
            fallbackSize="300x300"
            emptyIcon={<Tag className="h-12 w-12 text-gray-300" />}
          />
        </div>
        
        <CardContent className="p-4">
          {/* Business name */}
          {businessName && (
            <div className="flex items-center text-sm text-gray-500 mb-1">
              <Store className="h-3 w-3 mr-1" />
              <p className="truncate">{businessName}</p>
            </div>
          )}
          
          {/* Product name */}
          <h3 className={sizeClasses[size].title}>{productName}</h3>
          
          {/* Pricing */}
          <div className="flex justify-between items-center mt-2">
            <div>
              {originalPrice && (
                <p className="text-sm text-gray-500 line-through">
                  {formatPrice(originalPrice)}
                </p>
              )}
              {finalPrice && (
                <p className="text-lg font-bold text-green-600">
                  {formatPrice(finalPrice)}
                </p>
              )}
            </div>
            
            {/* Expiry info */}
            <div className="text-xs text-gray-500 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {daysRemaining} days left
            </div>
          </div>
          
          {/* Status badge for claimed offers */}
          {offer.user?.isClaimed && (
            <Badge className="mt-2 bg-blue-100 text-blue-800 hover:bg-blue-100 flex items-center w-fit">
              <CheckCircle className="h-3 w-3 mr-1" />
              Claimed
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}