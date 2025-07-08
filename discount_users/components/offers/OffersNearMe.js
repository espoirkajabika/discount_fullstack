import React, { useState, useEffect } from 'react';
import { MapPin, Search, Filter, Clock, Tag, Navigation, Loader2, AlertCircle, Star } from 'lucide-react';

const FindOffersNearMe = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [radius, setRadius] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [searchType, setSearchType] = useState('location'); // 'location' or 'address'

  // Load categories from API
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { OffersAPI } = await import('../lib/offersApi');
      const result = await OffersAPI.getCategories();
      
      if (result.success) {
        setCategories(result.data);
      } else {
        console.error('Failed to load categories:', result.error);
        // Fallback categories
        setCategories([
          { id: '1', name: 'Restaurants', icon: '🍕' },
          { id: '2', name: 'Retail', icon: '🛍️' },
          { id: '3', name: 'Services', icon: '⚡' },
          { id: '4', name: 'Entertainment', icon: '🎬' }
        ]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Get user's current location
  const getCurrentLocation = () => {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setLocation(coords);
        searchOffers(coords.latitude, coords.longitude);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError('Unable to get your location. Please try searching by address.');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Search offers by coordinates
  const searchOffers = async (lat, lng) => {
    try {
      setLoading(true);
      setError('');

      const { default: OffersAPI } = await import('../lib/offersApi');
      
      const result = await OffersAPI.searchNearby(lat, lng, {
        radius: radius,
        limit: 20,
        categoryId: selectedCategory || undefined
      });

      if (result.success) {
        setOffers(result.data);
        if (result.data.length === 0) {
          setError(`No offers found within ${radius}km. Try expanding your search radius.`);
        }
      } else {
        setError(result.error || 'Failed to search for offers');
        setOffers([]);
      }
      
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search for offers. Please try again.');
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  // Search by address
  const searchByAddress = async () => {
    if (!searchAddress.trim()) {
      setError('Please enter an address');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { default: OffersAPI } = await import('../lib/offersApi');
      
      const result = await OffersAPI.searchByAddress(searchAddress, {
        radius: radius,
        limit: 20,
        categoryId: selectedCategory || undefined
      });

      if (result.success) {
        setOffers(result.data);
        setLocation(result.geocodedLocation);
        
        if (result.data.length === 0) {
          setError(`No offers found near "${searchAddress}" within ${radius}km.`);
        }
      } else {
        setError(result.error || 'Failed to find location. Please check the address and try again.');
        setOffers([]);
      }
      
    } catch (err) {
      console.error('Address search error:', err);
      setError('Failed to find location. Please check the address and try again.');
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  // Format time remaining
  const getTimeRemaining = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry - now;
    
    if (diff < 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} left`;
    return 'Expires soon';
  };

  // Handle offer claiming
  const handleClaimOffer = async (offer) => {
    try {
      const { default: OffersAPI } = await import('../lib/offersApi');
      
      const result = await OffersAPI.claimOffer(offer.offer_id, 'online');
      
      if (result.success) {
        // Show success message or redirect to claim details
        alert(`Successfully claimed: ${offer.offer_title}`);
        // Optionally refresh the offers list
        if (location) {
          searchOffers(location.latitude, location.longitude);
        }
      } else {
        alert(`Failed to claim offer: ${result.error}`);
      }
    } catch (error) {
      console.error('Claim offer error:', error);
      alert('Failed to claim offer. Please try again.');
    }
  };

  const OfferCard = ({ offer }) => (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {offer.offer_title}
            </h3>
            <p className="text-sm text-gray-600">{offer.business_name}</p>
          </div>
          <div className="text-right">
            <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
              {offer.discount_text}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-700 text-sm mb-4">
          {offer.offer_description}
        </p>

        {/* Price info */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-lg font-bold text-gray-900">
              ${offer.discounted_price?.toFixed(2)}
            </span>
            {offer.original_price && (
              <span className="text-sm text-gray-500 line-through ml-2">
                ${offer.original_price.toFixed(2)}
              </span>
            )}
          </div>
          <div className="text-green-600 font-medium text-sm">
            Save ${offer.savings_amount?.toFixed(2)}
          </div>
        </div>

        {/* Details */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{offer.distance_km}km away</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>{getTimeRemaining(offer.expiry_date)}</span>
          </div>
        </div>

        {/* Claims remaining */}
        {offer.remaining_claims !== null && (
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-1">
              {offer.remaining_claims} claims remaining
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-orange-400 h-1.5 rounded-full"
                style={{ width: `${100 - offer.claim_percentage}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Address */}
        <p className="text-xs text-gray-500 mb-4">
          {offer.business_address}
        </p>

        {/* Action button */}
        <button 
          onClick={() => handleClaimOffer(offer)}
          className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Claim Offer
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
        Find Offers Near You
      </h1>

      {/* Search Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        {/* Search Type Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setSearchType('location')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              searchType === 'location'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Navigation className="h-4 w-4 inline mr-2" />
            Use My Location
          </button>
          <button
            onClick={() => setSearchType('address')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              searchType === 'address'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Search className="h-4 w-4 inline mr-2" />
            Search by Address
          </button>
        </div>

        {/* Location Search */}
        {searchType === 'location' && (
          <div className="flex justify-center">
            <button
              onClick={getCurrentLocation}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <MapPin className="h-5 w-5 mr-2" />
              )}
              Find Offers Near Me
            </button>
          </div>
        )}

        {/* Address Search */}
        {searchType === 'address' && (
          <div className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                placeholder="Enter address, city, or postal code"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && searchByAddress()}
              />
            </div>
            <button
              onClick={searchByAddress}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
            </button>
          </div>
        )}

        {/* Filters */}
        {location && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex flex-wrap items-center gap-4">
              {/* Radius selector */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">
                  Radius:
                </label>
                <select
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={1}>1 km</option>
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={25}>25 km</option>
                  <option value={50}>50 km</option>
                </select>
              </div>

              {/* Category filter */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">
                  Category:
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Update search button */}
              <button
                onClick={() => location && searchOffers(location.latitude, location.longitude)}
                disabled={loading}
                className="bg-gray-600 text-white px-4 py-1 rounded text-sm hover:bg-gray-700 disabled:opacity-50 transition-colors flex items-center"
              >
                <Filter className="h-4 w-4 mr-1" />
                Update
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Searching for offers near you...</p>
        </div>
      )}

      {/* Results */}
      {!loading && offers.length > 0 && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Found {offers.length} offers near you
            </h2>
            <div className="text-sm text-gray-500">
              Within {radius}km radius
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => (
              <OfferCard key={offer.offer_id} offer={offer} />
            ))}
          </div>
        </>
      )}

      {/* No Results */}
      {!loading && location && offers.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No offers found nearby
          </h3>
          <p className="text-gray-600 mb-4">
            Try expanding your search radius or checking a different area.
          </p>
          <button
            onClick={() => setRadius(radius < 50 ? radius * 2 : 50)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search wider area ({Math.min(radius * 2, 50)}km)
          </button>
        </div>
      )}
    </div>
  );
};

export default FindOffersNearMe;