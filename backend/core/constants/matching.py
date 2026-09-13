"""
Volunteer-matching tunables.

Each signal — skill fit, task urgency, distance, and past performance — is
scored independently on its own 0-100 percentage scale. Those four
percentages are then combined using fixed importance weights that sum to
exactly 1.0, so the final score is always directly readable as a mark out
of 100 without any further scaling.
"""

# Volunteers farther than this distance from a task are excluded from
# matching entirely (a hard filter, not a soft penalty).
MAX_MATCHING_DISTANCE_KM = 10

# Distance bands used by the distance percentage below.
DISTANCE_NEAR_KM = 2
DISTANCE_MEDIUM_KM = 5
DISTANCE_FAR_KM = 10

# ── Signal weights — how much each 0-100 percentage counts toward the final
# score. Must sum to 1.0.
WEIGHT_SKILL = 0.40
WEIGHT_URGENCY = 0.20
WEIGHT_DISTANCE = 0.20
WEIGHT_PERFORMANCE = 0.20

# ── Skill percentage — by the highest taxonomy tier (core/constants/skills.py)
# the volunteer holds for the task's need type.
SKILL_PCT_HIGH = 100
SKILL_PCT_MEDIUM = 60
SKILL_PCT_LOW = 30
SKILL_PCT_NONE = 0

# ── Urgency percentage — by the task's own urgency label.
URGENCY_PCT_HIGH = 100
URGENCY_PCT_MEDIUM = 50
URGENCY_PCT_LOW = 0

# ── Distance percentage — by which band the volunteer's distance falls in.
DISTANCE_PCT_NEAR = 100
DISTANCE_PCT_MEDIUM = 75
DISTANCE_PCT_FAR = 50
DISTANCE_PCT_BEYOND = 0

# ── Performance percentage for a volunteer with no assignment history yet.
# Neutral rather than 0, so a brand-new volunteer isn't permanently scored
# lowest before they've had any chance to build a track record.
PERFORMANCE_PCT_NEW_VOLUNTEER = 50
