import math
from django.db.models import Count, Q
from core.constants.matching import (
    MAX_MATCHING_DISTANCE_KM,
    DISTANCE_NEAR_KM, DISTANCE_MEDIUM_KM, DISTANCE_FAR_KM,
    WEIGHT_SKILL, WEIGHT_URGENCY, WEIGHT_DISTANCE, WEIGHT_PERFORMANCE,
    SKILL_PCT_HIGH, SKILL_PCT_MEDIUM, SKILL_PCT_LOW, SKILL_PCT_NONE,
    URGENCY_PCT_HIGH, URGENCY_PCT_MEDIUM, URGENCY_PCT_LOW,
    DISTANCE_PCT_NEAR, DISTANCE_PCT_MEDIUM, DISTANCE_PCT_FAR, DISTANCE_PCT_BEYOND,
    PERFORMANCE_PCT_NEW_VOLUNTEER,
)
from core.constants.clustering import EARTH_RADIUS_KM
from core.constants.skills import SKILL_TAXONOMY, HIGH, MEDIUM, LOW


def get_skill_pct(task, volunteer):
    """0-100: how well the volunteer's skills fit this task's need type.

    Exact match against the fixed taxonomy — the highest tier the volunteer
    holds wins. No partial-credit substring matching.
    """
    volunteer_skills = set(volunteer.skills) if isinstance(volunteer.skills, list) else set()
    tiers = SKILL_TAXONOMY.get(task.need_type, {})

    high_ids = {sid for sid, _ in tiers.get(HIGH, [])}
    medium_ids = {sid for sid, _ in tiers.get(MEDIUM, [])}
    low_ids = {sid for sid, _ in tiers.get(LOW, [])}

    if volunteer_skills & high_ids:
        return SKILL_PCT_HIGH
    if volunteer_skills & medium_ids:
        return SKILL_PCT_MEDIUM
    if volunteer_skills & low_ids:
        return SKILL_PCT_LOW
    return SKILL_PCT_NONE


def get_urgency_pct(task):
    """0-100: how urgent this task is."""
    urgency = task.urgency.lower()
    if urgency == "high":
        return URGENCY_PCT_HIGH
    if urgency == "medium":
        return URGENCY_PCT_MEDIUM
    return URGENCY_PCT_LOW


def calculate_distance(lat1, lon1, lat2, lon2):
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return EARTH_RADIUS_KM * 2 * math.asin(math.sqrt(a))


def get_distance_pct(distance):
    """0-100: how close the volunteer is, banded rather than linear."""
    if distance <= DISTANCE_NEAR_KM:
        return DISTANCE_PCT_NEAR
    if distance <= DISTANCE_MEDIUM_KM:
        return DISTANCE_PCT_MEDIUM
    if distance <= DISTANCE_FAR_KM:
        return DISTANCE_PCT_FAR
    return DISTANCE_PCT_BEYOND


def get_performance_pct(volunteer):
    """0-100: this volunteer's completed/total assignment ratio, as a percentage."""
    if volunteer.total_count == 0:
        # New volunteer — neutral score so they aren't permanently excluded.
        return PERFORMANCE_PCT_NEW_VOLUNTEER
    return (volunteer.completed_count / volunteer.total_count) * 100


def get_matched_volunteers(task):
    from apps.volunteers.models import Volunteer
    from apps.tasks.models import Assignment

    task_lat, task_lon = task.latitude, task.longitude

    busy_volunteers = Assignment.objects.filter(
        status="accepted"
    ).values_list("volunteer_id", flat=True)

    # Single query: annotate each volunteer with their completed assignment count.
    volunteers = (
        Volunteer.objects
        .filter(availability=True)
        .exclude(id__in=busy_volunteers)
        .annotate(
            completed_count=Count('assignment', filter=Q(assignment__status='completed')),
            total_count=Count('assignment'),
        )
        .select_related('user')
    )

    matched_volunteers = []

    for volunteer in volunteers:
        if not volunteer.latitude or not volunteer.longitude or not task_lat:
            continue

        distance = calculate_distance(task_lat, task_lon, volunteer.latitude, volunteer.longitude)

        if distance > MAX_MATCHING_DISTANCE_KM:
            continue

        skill_pct = get_skill_pct(task, volunteer)
        urgency_pct = get_urgency_pct(task)
        distance_pct = get_distance_pct(distance)
        performance_pct = get_performance_pct(volunteer)

        # Every signal above is already 0-100, and the four weights sum to
        # 1.0 — so this sum is always directly a score out of 100, with no
        # separate normalization step needed anywhere else.
        final_score = (
            skill_pct * WEIGHT_SKILL
            + urgency_pct * WEIGHT_URGENCY
            + distance_pct * WEIGHT_DISTANCE
            + performance_pct * WEIGHT_PERFORMANCE
        )

        matched_volunteers.append({
            "volunteer_id": volunteer.id,
            "name": volunteer.user.name,
            "skills": volunteer.skills,
            "location": volunteer.location,
            "distance_km": round(distance, 2),
            "score": round(final_score, 2),
        })

    matched_volunteers.sort(key=lambda x: x["score"], reverse=True)
    return matched_volunteers[:10]
