// components/AddressAutocomplete.js
'use client';

import { useState, useEffect } from 'react';
import GooglePlacesAutocomplete, { geocodeByAddress, getLatLng } from 'react-google-places-autocomplete';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, Check, Loader2, AlertCircle } from 'lucide-react';

const AddressAutocomplete = ({ 
  value, 
  onChange, 
  onLocationSelect,
  placeholder = "Enter your business address",
  required = false,
  className = ""
}) => {
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [error, setError] = useState('');

  // Initialize with existing value if provided
  useEffect(() => {
    if (value && !selectedPlace) {
      setSelectedPlace({ label: value, value: { description: value } });
    }
  }, [value, selectedPlace]);

  const processPlaceSelection = async (place) => {
    if (!place) return;

    setIsProcessing(true);
    setError('');

    try {
      console.log('Processing place selection:', place);

      // Get detailed information using geocodeByAddress
      const results = await geocodeByAddress(place.label);
      
      if (results && results.length > 0) {
        const addressComponents = results[0].address_components;
        const geometry = results[0].geometry;
        const placeId = results[0].place_id;
        const formattedAddress = results[0].formatted_address;

        // Get lat/lng
        const { lat, lng } = await getLatLng(results[0]);

        const locationData = {
          address: formattedAddress,
          latitude: lat,
          longitude: lng,
          place_id: placeId,
          address_components: addressComponents
        };

        console.log('Location data extracted:', locationData);

        // Update parent components
        onChange?.(formattedAddress);
        onLocationSelect?.(locationData);
        
        setLocationConfirmed(true);
        setError('');
      } else {
        throw new Error('No results found for the selected address');
      }
    } catch (error) {
      console.error('Error processing place selection:', error);
      setError('Failed to process the selected address. Please try again.');
      setLocationConfirmed(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlaceSelect = (place) => {
    console.log('Place selected:', place);
    setSelectedPlace(place);
    setLocationConfirmed(false);
    
    if (place) {
      processPlaceSelection(place);
    } else {
      // Handle clearing
      onChange?.('');
      onLocationSelect?.(null);
      setLocationConfirmed(false);
      setError('');
    }
  };

  const retryProcessing = () => {
    if (selectedPlace) {
      processPlaceSelection(selectedPlace);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="business_address" className="text-gray-700 font-semibold text-sm">
        Business Address {required && <span className="text-red-500">*</span>}
      </Label>
      
      <div className="relative">
        <GooglePlacesAutocomplete
          apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
          selectProps={{
            value: selectedPlace,
            onChange: handlePlaceSelect,
            placeholder: placeholder,
            isClearable: true,
            isSearchable: true,
            className: 'react-select-container',
            classNamePrefix: 'react-select',
            styles: {
              control: (provided, state) => ({
                ...provided,
                minHeight: '48px',
                borderColor: state.isFocused ? '#10b981' : '#d1d5db',
                boxShadow: state.isFocused ? '0 0 0 1px #10b981' : 'none',
                '&:hover': {
                  borderColor: '#10b981'
                }
              }),
              placeholder: (provided) => ({
                ...provided,
                color: '#9ca3af'
              }),
              input: (provided) => ({
                ...provided,
                margin: 0,
                paddingTop: 0,
                paddingBottom: 0
              })
            },
            components: {
              DropdownIndicator: () => (
                <div className="px-3">
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  ) : locationConfirmed ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <MapPin className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              )
            }
          }}
          apiOptions={{
            componentRestrictions: { country: 'ca' }, // Restrict to Canada
            types: ['establishment', 'geocode']
          }}
          debounce={300}
        />
      </div>

      {/* Status Messages */}
      {isProcessing && (
        <div className="flex items-center space-x-2 text-sm text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Processing address...</span>
        </div>
      )}

      {locationConfirmed && !isProcessing && (
        <div className="flex items-center space-x-2 text-sm text-green-600">
          <Check className="h-4 w-4" />
          <span>Location confirmed</span>
        </div>
      )}

      {error && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
          {selectedPlace && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={retryProcessing}
              className="text-xs"
            >
              Try Again
            </Button>
          )}
        </div>
      )}

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && locationConfirmed && (
        <details className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <summary>Debug Info (dev only)</summary>
          <pre className="mt-1 text-xs overflow-auto">
            {JSON.stringify(selectedPlace, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};

export default AddressAutocomplete;