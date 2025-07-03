// components/AddressAutocomplete.js
'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, Check, Loader2, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const AddressAutocomplete = ({ 
  value, 
  onChange, 
  onLocationSelect,
  placeholder = "Enter your business address",
  required = false,
  className = ""
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGeocodingManual, setIsGeocodingManual] = useState(false);
  const [locationSelected, setLocationSelected] = useState(false);
  
  const inputRef = useRef(null);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  
  // Initialize Google Places API
  useEffect(() => {
    const initGooglePlaces = () => {
      if (window.google && window.google.maps) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        // Create a dummy map for PlacesService (required by Google)
        const dummyMap = new window.google.maps.Map(document.createElement('div'));
        placesService.current = new window.google.maps.places.PlacesService(dummyMap);
      }
    };

    // Load Google Maps API if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initGooglePlaces;
      document.head.appendChild(script);
    } else {
      initGooglePlaces();
    }
  }, []);

  // Get place predictions from Google Places API
  const getPlacePredictions = async (input) => {
    if (!autocompleteService.current || input.length < 3) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);
    
    try {
      autocompleteService.current.getPlacePredictions(
        {
          input: input,
          types: ['establishment', 'geocode'],
          componentRestrictions: { country: 'ca' }, // Restrict to Canada
        },
        (predictions, status) => {
          setIsLoading(false);
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setPredictions(predictions.slice(0, 5)); // Limit to 5 suggestions
            setShowSuggestions(true);
          } else {
            setPredictions([]);
            setShowSuggestions(false);
          }
        }
      );
    } catch (error) {
      console.error('Error getting place predictions:', error);
      setIsLoading(false);
      setPredictions([]);
    }
  };

  // Get detailed place information
  const getPlaceDetails = async (placeId) => {
    if (!placesService.current) return null;

    return new Promise((resolve) => {
      placesService.current.getDetails(
        {
          placeId: placeId,
          fields: ['geometry', 'formatted_address', 'address_components', 'place_id', 'name']
        },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            resolve(place);
          } else {
            resolve(null);
          }
        }
      );
    });
  };

  // Fallback geocoding using Google Geocoding API
  const geocodeAddress = async (address) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        return {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
          formatted_address: result.formatted_address,
          place_id: result.place_id,
          address_components: result.address_components
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setLocationSelected(false);
    onChange?.(value);
    
    // Debounce API calls
    setTimeout(() => {
      if (value === inputValue) {
        getPlacePredictions(value);
      }
    }, 300);
  };

  // Handle prediction selection
  const handlePredictionSelect = async (prediction) => {
    setInputValue(prediction.description);
    setShowSuggestions(false);
    setIsLoading(true);
    
    const placeDetails = await getPlaceDetails(prediction.place_id);
    
    if (placeDetails) {
      const locationData = {
        address: placeDetails.formatted_address,
        latitude: placeDetails.geometry.location.lat(),
        longitude: placeDetails.geometry.location.lng(),
        place_id: placeDetails.place_id,
        address_components: placeDetails.address_components
      };
      
      setLocationSelected(true);
      onChange?.(placeDetails.formatted_address);
      onLocationSelect?.(locationData);
    }
    
    setIsLoading(false);
  };

  // Handle manual geocoding
  const handleManualGeocode = async () => {
    if (!inputValue.trim()) return;
    
    setIsGeocodingManual(true);
    const result = await geocodeAddress(inputValue);
    
    if (result) {
      const locationData = {
        address: result.formatted_address,
        latitude: result.latitude,
        longitude: result.longitude,
        place_id: result.place_id,
        address_components: result.address_components
      };
      
      setInputValue(result.formatted_address);
      setLocationSelected(true);
      onChange?.(result.formatted_address);
      onLocationSelect?.(locationData);
    }
    
    setIsGeocodingManual(false);
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`space-y-2 ${className}`} ref={inputRef}>
      <Label htmlFor="business_address" className="text-gray-700 font-semibold text-sm">
        Business Address {required && <span className="text-red-500">*</span>}
      </Label>
      
      <div className="relative">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            id="business_address"
            name="business_address"
            type="text"
            required={required}
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="pl-10 pr-20 h-12 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg"
            autoComplete="off"
          />
          
          {/* Status indicators */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            {locationSelected && <Check className="h-4 w-4 text-green-500" />}
            {!locationSelected && inputValue.length > 3 && !isLoading && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleManualGeocode}
                disabled={isGeocodingManual}
                className="h-8 px-2 text-xs"
              >
                {isGeocodingManual ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Search className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && predictions.length > 0 && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto border shadow-lg">
            <CardContent className="p-0">
              {predictions.map((prediction) => (
                <button
                  key={prediction.place_id}
                  type="button"
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  onClick={() => handlePredictionSelect(prediction)}
                >
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {prediction.structured_formatting.main_text}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {prediction.structured_formatting.secondary_text}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Location confirmation */}
      {locationSelected && (
        <div className="flex items-center space-x-2 text-sm text-green-600">
          <Check className="h-4 w-4" />
          <span>Location confirmed</span>
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;