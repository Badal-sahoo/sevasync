import requests
import time
from core.constants.clustering import GEOCODING_FALLBACK_LAT, GEOCODING_FALLBACK_LON

_cache = {}  # Level 1: in-memory, reset on server restart


def geocode_location(pincode=None, location=None):
    key = pincode or location
    if not key:
        return None, None

    # Level 1 — in-memory hit (no DB round-trip)
    if key in _cache:
        return _cache[key]

    # Level 2 — persistent DB cache (survives restarts, shared across workers)
    try:
        from apps.geocoding.models import GeocodedLocation
        cached = GeocodedLocation.objects.get(query=key)
        result = (cached.latitude, cached.longitude)
        _cache[key] = result  # promote to L1 so next lookup in same process is instant
        return result
    except Exception:
        pass  # DB miss or unavailable — fall through to API

    # Level 3 — live Nominatim API call (rate-limited, 0.5s sleep)
    url = f"https://nominatim.openstreetmap.org/search?q={key}&format=json"
    headers = {'User-Agent': 'SevaSync/1.0'}

    try:
        res = requests.get(url, headers=headers, timeout=10).json()
        if res:
            lat = float(res[0]["lat"])
            lon = float(res[0]["lon"])
            result = (lat, lon)
            _cache[key] = result

            # Persist to DB — get_or_create avoids IntegrityError on concurrent uploads
            try:
                from apps.geocoding.models import GeocodedLocation
                GeocodedLocation.objects.get_or_create(
                    query=key,
                    defaults={'latitude': lat, 'longitude': lon, 'source': 'nominatim'}
                )
            except Exception:
                pass  # Persistence failure is non-fatal; in-memory cache still works

            time.sleep(0.5)  # Nominatim rate limit: max 1 req/sec
            return result
    except Exception as e:
        print(f"Geocoding error for '{key}': {e}")

    return GEOCODING_FALLBACK_LAT, GEOCODING_FALLBACK_LON
