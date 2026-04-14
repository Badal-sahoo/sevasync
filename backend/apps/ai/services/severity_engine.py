def calculate_base_severity(features):
    score = (
        features["medical"] * 3 +
        features["food"] * 2 +
        features["water"] * 2 +
        features["shelter"] * 2 +
        features["electricity"] * 1 +
        features["general"] * 1
    )

    if score >= 15:
        return "HIGH"
    elif score >= 7:
        return "MEDIUM"
    return "LOW"