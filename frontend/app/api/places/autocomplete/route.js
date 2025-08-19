import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { input } = await request.json()

    if (!input || input.length < 3) {
      return NextResponse.json({ predictions: [] })
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      console.error('Google Maps API key not found')
      return NextResponse.json({ error: 'API configuration error' }, { status: 500 })
    }

    // Build the request URL for Google Places Autocomplete API
    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json')
    url.searchParams.append('input', input)
    url.searchParams.append('types', 'establishment|geocode')
    url.searchParams.append('components', 'country:us|country:ca')
    url.searchParams.append('key', apiKey)

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status === 'OK') {
      return NextResponse.json({ predictions: data.predictions })
    } else {
      console.error('Google Places API error:', data.status, data.error_message)
      return NextResponse.json({ predictions: [] })
    }

  } catch (error) {
    console.error('Places autocomplete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}