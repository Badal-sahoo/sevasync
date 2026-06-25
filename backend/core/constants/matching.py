# Volunteers farther than this distance from a task are excluded from matching.
MAX_MATCHING_DISTANCE_KM = 10

# Distance bands for the distance score component (see scoring/distance.py).
DISTANCE_NEAR_KM = 2
DISTANCE_MEDIUM_KM = 5
DISTANCE_FAR_KM = 10

# Maximum score each component can contribute to the final volunteer score.
SCORE_MAX_SKILL = 40
SCORE_MAX_URGENCY = 20
SCORE_MAX_DISTANCE = 20
SCORE_MAX_PERFORMANCE = 20

# Score awarded for a partial (keyword) skill match.
SCORE_PARTIAL_SKILL = 20
