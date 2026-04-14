def extract_features(cluster):
    features = {
        "total_needs": len(cluster),
        "medical": 0,
        "food": 0,
        "water": 0,
        "shelter": 0,
        "electricity": 0,
        "general": 0,
    }

    for need in cluster:
        features[need.need_type] += 1

    # Density logic
    if features["total_needs"] >= 8:
        features["density"] = "high"
    elif features["total_needs"] >= 4:
        features["density"] = "medium"
    else:
        features["density"] = "low"

    return features