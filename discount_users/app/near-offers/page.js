// app/offers/page.js (or pages/offers.js if using Pages Router)
'use client';

import { useState, useEffect } from 'react';
import FindOffersNearMe from '@/components/offers/OffersNearMe';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { MapPin, Smartphone, Search, Star } from 'lucide-react';

export default function OffersPage() {
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Discover Amazing Deals Near You
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Find exclusive offers from local businesses in your area
            </p>
            <div className="flex justify-center space-x-4">
              <div className="flex items-center bg-white/20 rounded-full px-4 py-2">
                <MapPin className="h-5 w-5 mr-2" />
                <span>Location-based</span>
              </div>
              <div className="flex items-center bg-white/20 rounded-full px-4 py-2">
                <Star className="h-5 w-5 mr-2" />
                <span>Verified offers</span>
              </div>
              <div className="flex items-center bg-white/20 rounded-full px-4 py-2">
                <Smartphone className="h-5 w-5 mr-2" />
                <span>Easy to claim</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <button
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="text-blue-600 hover:text-blue-700 font-medium text-lg"
          >
            How it works {showHowItWorks ? '▲' : '▼'}
          </button>
        </div>

        {showHowItWorks && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">1. Share Your Location</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  Allow location access or enter your address to find offers near you
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-lg">2. Browse Nearby Offers</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  See exclusive deals from businesses within your chosen radius
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Smartphone className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-lg">3. Claim & Save</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  Claim offers instantly and show them at the business to redeem
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Main Component */}
      <FindOffersNearMe />

      {/* Footer */}
      <div className="bg-gray-800 text-white mt-16">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">
              Can't find what you're looking for?
            </h3>
            <p className="text-gray-300 mb-4">
              Check back regularly as businesses add new offers daily!
            </p>
            <div className="flex justify-center space-x-4">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Subscribe to Updates
              </button>
              <button className="border border-gray-500 text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                Suggest a Business
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}