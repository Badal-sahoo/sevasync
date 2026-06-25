from core.constants.severity import DENSITY_HIGH_COUNT, DENSITY_MEDIUM_COUNT


def extract_features(cluster):
    features = {
        "need_count": len(cluster),
        "medical": 0, "food": 0, "water": 0,
        "shelter": 0, "electricity": 0, "general": 0,
    }

    for need in cluster:
        features[need.need_type] += 1

    if features["need_count"] >= DENSITY_HIGH_COUNT:
        features["density"] = "high"
    elif features["need_count"] >= DENSITY_MEDIUM_COUNT:
        features["density"] = "medium"
    else:
        features["density"] = "low"

    return features
