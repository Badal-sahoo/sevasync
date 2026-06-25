# Geographic radius used by DBSCAN to group nearby needs into one cluster.
CLUSTER_RADIUS_KM = 1.5

# Minimum number of need points required to form a cluster (smaller groups become noise).
CLUSTER_MIN_SAMPLES = 3

# Earth's radius in kilometres, used to convert km to radians for Haversine calculations.
EARTH_RADIUS_KM = 6371.0

# Fallback coordinates (centre of India) when geocoding returns no result.
GEOCODING_FALLBACK_LAT = 20.5937
GEOCODING_FALLBACK_LON = 78.9629
