# Create app/utils/geocoding.py
import aiohttp
import os
from typing import Optional, Dict, Any

async def geocode_address(address: str) -> Optional[Dict[str, Any]]:
    """
    Geocode an address using Google Geocoding API
    """
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        return None
    
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        "address": address,
        "key": api_key
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if data["status"] == "OK" and data["results"]:
                        result = data["results"][0]
                        location = result["geometry"]["location"]
                        
                        return {
                            "latitude": location["lat"],
                            "longitude": location["lng"],
                            "formatted_address": result["formatted_address"],
                            "place_id": result.get("place_id"),
                            "address_components": result.get("address_components")
                        }
                return None
    except Exception as e:
        print(f"Geocoding error: {e}")
        return None