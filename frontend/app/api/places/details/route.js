import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { placeId } = await request.json()

    if (!placeId) {
      return NextResponse.json({ error: 'Place ID is required' }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      console.error('Google Maps API key not found')
      return NextResponse.json({ error: 'API configuration error' }, { status: 500 })
    }

    // Build the request URL for Google Places Details API
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')
    url.searchParams.append('place_id', placeId)
    url.searchParams.append('fields', 'name,formatted_address,geometry,place_id,address_components,types')
    url.searchParams.append('key', apiKey)

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status === 'OK' && data.result) {
      const place = data.result
      
      // Format the response to match what the frontend expects
      return NextResponse.json({
        place: {
          name: place.name,
          formatted_address: place.formatted_address,
          geometry: {
            location: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng
            }
          },
          place_id: place.place_id,
          address_components: place.address_components,
          types: place.types
        }
      })
    } else {
      console.error('Google Places Details API error:', data.status, data.error_message)
      return NextResponse.json({ error: 'Place not found' }, { status: 404 })
    }

  } catch (error) {
    console.error('Places details error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}