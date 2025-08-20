import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { input } = await request.json()

    if (!input || input.length < 5) {  // Increased from 3 to 5 characters
      return NextResponse.json({ predictions: [] })
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      console.error('Google Maps API key not found in environment variables')
      console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('GOOGLE')))
      return NextResponse.json({ 
        error: 'Google Maps API key not configured in environment variables' 
      }, { status: 500 })
    }

    // Build the request URL for Google Places Autocomplete API
    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json')
    url.searchParams.append('input', input)
    url.searchParams.append('components', 'country:us|country:ca')
    url.searchParams.append('key', apiKey)

    console.log('Making request to Google Places API:', url.toString().replace(apiKey, 'HIDDEN_KEY'))

    const response = await fetch(url.toString())
    const data = await response.json()

    console.log('Google Places API response:', { status: data.status, predictions_count: data.predictions?.length, error: data.error_message })

    if (data.status === 'OK') {
      return NextResponse.json({ predictions: data.predictions })
    } else {
      console.error('Google Places API error:', data.status, data.error_message)
      console.error('Full Google response:', data)
      return NextResponse.json({ predictions: [] })
    }

  } catch (error) {
    console.error('Places autocomplete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}