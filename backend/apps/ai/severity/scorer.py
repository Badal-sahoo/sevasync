from core.constants.severity import (
    WEIGHT_MEDICAL, WEIGHT_FOOD, WEIGHT_WATER, WEIGHT_SHELTER,
    WEIGHT_ELECTRICITY, WEIGHT_GENERAL,
    THRESHOLD_HIGH, THRESHOLD_MEDIUM,
    CRITICALITY, SIZE_LARGE_COUNT, SIZE_MEDIUM_COUNT, SEVERITY_HIGH, SEVERITY_MEDIUM,
)


def severity_for(need_type, people_count):
    """Urgency for a single task = type criticality + a people-count size tier.

    Produces a realistic HIGH/MEDIUM/LOW spread instead of labelling everything HIGH.
    """
    base = CRITICALITY.get(need_type, 0)
    if people_count >= SIZE_LARGE_COUNT:
        size = 2
    elif people_count >= SIZE_MEDIUM_COUNT:
        size = 1
    else:
        size = 0
    score = base + size
    if score >= SEVERITY_HIGH:
        return "HIGH"
    if score >= SEVERITY_MEDIUM:
        return "MEDIUM"
    return "LOW"


def calculate_base_severity(features):
    score = (
        features["medical"] * WEIGHT_MEDICAL +
        features["food"] * WEIGHT_FOOD +
        features["water"] * WEIGHT_WATER +
        features["shelter"] * WEIGHT_SHELTER +
        features["electricity"] * WEIGHT_ELECTRICITY +
        features["general"] * WEIGHT_GENERAL
    )

    if score >= THRESHOLD_HIGH:
        return "HIGH"
    elif score >= THRESHOLD_MEDIUM:
        return "MEDIUM"
    return "LOW"
