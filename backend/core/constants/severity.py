# Weights used to compute the base severity score for a cluster.
# Higher weight = greater contribution to urgency.
WEIGHT_MEDICAL = 3
WEIGHT_FOOD = 2
WEIGHT_WATER = 2
WEIGHT_SHELTER = 2
WEIGHT_ELECTRICITY = 1
WEIGHT_GENERAL = 1

# Score thresholds that map the weighted sum to a severity label.
THRESHOLD_HIGH = 15
THRESHOLD_MEDIUM = 7

# Need-count thresholds for the density label attached to each cluster.
DENSITY_HIGH_COUNT = 8
DENSITY_MEDIUM_COUNT = 4

# ── Per-task severity ────────────────────────────────────────────────────────
# Each task's urgency = type criticality + a size tier, so urgency reflects BOTH
# what the need is and how many people it affects (instead of a raw cluster sum
# that pushed essentially every task to "HIGH").
CRITICALITY = {
    "medical": 3,
    "shelter": 2,
    "water": 2,
    "food": 2,
    "electricity": 1,
    "general": 0,
}
# People-count tiers that add to the score.
SIZE_LARGE_COUNT = 25   # +2
SIZE_MEDIUM_COUNT = 8   # +1
# Combined-score → label.
SEVERITY_HIGH = 4
SEVERITY_MEDIUM = 2
