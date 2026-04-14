import numpy as np
from sklearn.cluster import DBSCAN

def run_dbscan(needs):
    coords = np.array([[n.latitude, n.longitude] for n in needs if n.latitude and n.longitude])

    if len(coords) == 0:
        return []

    db = DBSCAN(eps=0.01, min_samples=3).fit(coords)
    labels = db.labels_

    clusters = {}
    for i, label in enumerate(labels):
        if label not in clusters:
            clusters[label] = []
        clusters[label].append(needs[i])

    return clusters