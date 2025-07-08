// components/LocationPermissionModal.js
import React from 'react';
import { X, MapPin, Shield, Clock } from 'lucide-react';

const LocationPermissionModal = ({ isOpen, onClose, onAllow, onDeny }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md mx-4 p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <MapPin className="h-8 w-8 text-blue-600" />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Allow Location Access
          </h3>
          
          <p className="text-gray-600 mb-6">
            We need your location to find the best offers near you. Your location data is never stored or shared.
          </p>

          {/* Benefits */}
          <div className="space-y-3 mb-6 text-left">
            <div className="flex items-start">
              <Clock className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Instant Results</p>
                <p className="text-xs text-gray-600">Find offers in seconds</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <MapPin className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Nearby Only</p>
                <p className="text-xs text-gray-600">See offers you can actually use</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-purple-500 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Privacy Protected</p>
                <p className="text-xs text-gray-600">We don't store your location</p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={onAllow}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Allow Location Access
            </button>
            
            <button
              onClick={onDeny}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Search by Address Instead
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            You can change this setting anytime in your browser preferences.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LocationPermissionModal;