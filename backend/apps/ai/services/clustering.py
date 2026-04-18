import numpy as np
from sklearn.cluster import DBSCAN

def run_dbscan(needs):
    # Filter needs to ensure they have valid coordinates
    valid_needs = [n for n in needs if n.latitude is not None and n.longitude is not None]
    
    if not valid_needs:
        return {}

    # Extract coordinates
    coords = np.array([[n.latitude, n.longitude] for n in valid_needs])

    # Convert latitude and longitude to radians for the Haversine metric
    coords_radians = np.radians(coords)

    # Earth's radius in kilometers
    earth_radius_km = 6371.0
    
    # Define the clustering radius (e.g., 1.5 kilometers)
    cluster_radius_km = 1.5 
    epsilon_radians = cluster_radius_km / earth_radius_km

    # Initialize DBSCAN with haversine metric and ball_tree algorithm
    db = DBSCAN(
        eps=epsilon_radians, 
        min_samples=3, 
        metric='haversine', 
        algorithm='ball_tree'
    ).fit(coords_radians)
    
    labels = db.labels_
    clusters = {}
    
    for i, label in enumerate(labels):
        if label not in clusters:
            clusters[label] = []
        clusters[label].append(valid_needs[i])

    return clusters