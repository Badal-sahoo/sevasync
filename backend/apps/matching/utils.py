import math
from django.db.models import Count, Q
from core.constants.matching import (
    MAX_MATCHING_DISTANCE_KM,
    DISTANCE_NEAR_KM, DISTANCE_MEDIUM_KM, DISTANCE_FAR_KM,
    SCORE_MAX_SKILL, SCORE_MAX_URGENCY, SCORE_MAX_DISTANCE, SCORE_MAX_PERFORMANCE,
    SCORE_PARTIAL_SKILL,
)
from core.constants.clustering import EARTH_RADIUS_KM


def score_volunteer_for_task(task, volunteer):
    score = 0
    task_needs = task.need_type.lower()

    if isinstance(volunteer.skills, list):
        volunteer_skills = " ".join(volunteer.skills).lower()
    else:
        volunteer_skills = str(volunteer.skills).lower()

    if task_needs in volunteer_skills:
        score += SCORE_MAX_SKILL
    else:
        task_keywords = task_needs.split()
        matches = sum(1 for word in task_keywords if word in volunteer_skills)
        if matches > 0:
            score += SCORE_PARTIAL_SKILL

    if task.urgency.lower() == "high":
        score += SCORE_MAX_URGENCY
    elif task.urgency.lower() == "medium":
        score += SCORE_MAX_URGENCY // 2

    return score


def calculate_distance(lat1, lon1, lat2, lon2):
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return EARTH_RADIUS_KM * 2 * math.asin(math.sqrt(a))


def get_distance_score(distance):
    if distance <= DISTANCE_NEAR_KM:
        return SCORE_MAX_DISTANCE
    elif distance <= DISTANCE_MEDIUM_KM:
        return 15
    elif distance <= DISTANCE_FAR_KM:
        return 10
    return 0


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

        base_score = score_volunteer_for_task(task, volunteer)
        distance_score = get_distance_score(distance)

        if volunteer.total_count == 0:
            # New volunteer — neutral score so they aren't permanently excluded.
            performance_score = 0.5 * SCORE_MAX_PERFORMANCE
        else:
            performance_score = (volunteer.completed_count / volunteer.total_count) * SCORE_MAX_PERFORMANCE

        matched_volunteers.append({
            "volunteer_id": volunteer.id,
            "name": volunteer.user.name,
            "skills": volunteer.skills,
            "location": volunteer.location,
            "distance_km": round(distance, 2),
            "score": round(base_score + distance_score + performance_score, 2),
        })

    matched_volunteers.sort(key=lambda x: x["score"], reverse=True)
    return matched_volunteers[:10]
