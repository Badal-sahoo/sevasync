import numpy as np
from sklearn.cluster import DBSCAN
from core.constants.clustering import CLUSTER_RADIUS_KM, CLUSTER_MIN_SAMPLES, EARTH_RADIUS_KM


def cluster_needs_geographically(needs):
    valid_needs = [n for n in needs if n.latitude is not None and n.longitude is not None]

    if not valid_needs:
        return {}

    coords = np.array([[n.latitude, n.longitude] for n in valid_needs])
    coords_radians = np.radians(coords)
    epsilon_radians = CLUSTER_RADIUS_KM / EARTH_RADIUS_KM

    db = DBSCAN(
        eps=epsilon_radians,
        min_samples=CLUSTER_MIN_SAMPLES,
        metric='haversine',
        algorithm='ball_tree',
    ).fit(coords_radians)

    clusters = {}
    for i, label in enumerate(db.labels_):
        if label not in clusters:
            clusters[label] = []
        clusters[label].append(valid_needs[i])

    return clusters
