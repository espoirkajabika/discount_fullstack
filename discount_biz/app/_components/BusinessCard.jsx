// app/customer/_components/BusinessCard.js

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StorageImage } from '@/components/ui/storage-image';
import { MapPin, Store, Tag } from 'lucide-react';

export default function BusinessCard({ business }) {
  // Format the business address to show only the first part before the comma
  const formatShortAddress = (address) => {
    if (!address) return '';
    const parts = address.split(',');
    return parts[0];
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden border hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Business Avatar */}
          <div className="h-20 w-20 rounded-md bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
            <StorageImage
              path={business.avatar}
              alt={business.business_name}
              className="w-full h-full object-cover"
              fallbackSize="200x200"
              emptyIcon={<Store className="h-10 w-10 text-gray-300" />}
            />
          </div>

          {/* Business Details */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">{business.business_name}</h3>
            
            {/* Description (truncated) */}
            {business.business_description && (
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                {business.business_description}
              </p>
            )}
            
            {/* Categories */}
            {business.categories && business.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {business.categories.slice(0, 3).map((category, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {category}
                  </Badge>
                ))}
                {business.categories.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{business.categories.length - 3} more
                  </Badge>
                )}
              </div>
            )}
            
            {/* Location */}
            {business.business_address && (
              <div className="flex items-center text-sm text-gray-500 mb-3">
                <MapPin className="h-3.5 w-3.5 mr-1" />
                <span>{formatShortAddress(business.business_address)}</span>
              </div>
            )}
            
            {/* Active Offers Count */}
            <div className="flex items-center">
              <Tag className="h-4 w-4 text-blue-600 mr-1" />
              <span className="text-sm font-medium">
                {business.offers_count || 0} active offers
              </span>
            </div>
          </div>
          
          {/* Action Button */}
          <div className="flex sm:flex-col justify-between sm:justify-center items-end gap-2">
            <Button asChild className="whitespace-nowrap">
              <Link href={`/customer/businesses/${business.id}`}>
                View Business
              </Link>
            </Button>
            <Button asChild variant="outline" className="whitespace-nowrap">
              <Link href={`/customer/offers?businessId=${business.id}`}>
                See Offers
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}