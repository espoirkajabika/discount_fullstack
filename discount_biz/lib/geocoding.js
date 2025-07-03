// lib/geocoding.js
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export class GeocodingService {
  static async geocodeAddress(address) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        return {
          success: true,
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
          formatted_address: result.formatted_address,
          place_id: result.place_id,
          address_components: result.address_components
        };
      }
      
      return {
        success: false,
        error: 'Address not found'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Geocoding service unavailable'
      };
    }
  }
}