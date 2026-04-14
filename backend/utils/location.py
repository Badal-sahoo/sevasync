import requests
import time

location_cache = {}

def get_lat_long(pincode=None, location=None):
    key = pincode or location

    if key in location_cache:
        return location_cache[key]

    query = pincode if pincode else location
    if not query:
        return None, None

    url = f"https://nominatim.openstreetmap.org/search?q={query}&format=json"
    headers = {'User-Agent': 'SevaSync-Demo/1.0'}

    try:
        res = requests.get(url, headers=headers).json()
        if res:
            lat = float(res[0]["lat"])
            lon = float(res[0]["lon"])

            location_cache[key] = (lat, lon)
            
            # Sleep slightly to avoid an instant IP ban, but keep it snappy for the demo
            time.sleep(0.5) 
            return lat, lon
    except Exception as e:
        print(f"Geocoding error: {e}")
        pass

    return 20.5937, 78.9629