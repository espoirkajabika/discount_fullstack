'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, ExternalLink } from 'lucide-react';

export default function LocationMap({ address, businessName = '' }) {
  if (!address) return null;
  
  // Function to open the address in Google Maps
  const openInGoogleMaps = () => {
    const query = encodeURIComponent(`${businessName ? businessName + ', ' : ''}${address}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };
  
  return (
    <Card className="overflow-hidden">
      <div 
        className="h-48 bg-gray-100 flex items-center justify-center cursor-pointer"
        onClick={openInGoogleMaps}
      >
        <div className="text-center p-4">
          <MapPin className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-700 font-medium">{businessName || 'Business Location'}</p>
          <p className="text-gray-500 text-sm">{address}</p>
        </div>
      </div>
      
      <CardContent className="p-0">
        <Button 
          variant="outline" 
          className="w-full rounded-t-none h-12 flex items-center justify-center"
          onClick={openInGoogleMaps}
        >
          <MapPin className="h-4 w-4 mr-2" />
          View on Google Maps
          <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}