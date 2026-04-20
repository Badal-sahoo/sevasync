import math
import os
from google import genai

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in KM

    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))

    return R * c
# matching/utils.py
def get_performance_score(volunteer):
    from apps.tasks.models import Assignment

    total = Assignment.objects.filter(volunteer=volunteer).count()
    completed = Assignment.objects.filter(
        volunteer=volunteer, status="completed"
    ).count()

    if total == 0:
        return 0

    return (completed / total) * 20

def get_distance_score(distance):
    if distance <= 2:
        return 20
    elif distance <= 5:
        return 15
    elif distance <= 10:
        return 10
    else:
        return 0
    


client = genai.Client(api_key=os.getenv("AI_API_KEY"))

def gemini_refine_scores(task, candidates):
    try:
        prompt = f"""
You are an AI system that ranks volunteers for a task.

Task:
Type: {task.need_type}
Urgency: {task.urgency}
Location: {task.location}

Volunteers:
"""

        for i, v in enumerate(candidates, 1):
            prompt += f"""
{i}. Name: {v['name']}
   Skills: {v['skills']}
   Distance: {v['distance_km']} km
   Base Score: {v['score']}
"""

        prompt += """
Return ONLY a JSON list like:
[
  {"name": "Rahul", "score": 95},
  {"name": "Aman", "score": 88}
]
Do not add explanation.
"""

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )

        text = response.text.strip()

        import json
        refined = json.loads(text)

        return refined

    except Exception as e:
        print("Gemini error:", e)
        return None
    
def get_matched_volunteers(task):
    from apps.volunteers.models import Volunteer
    from apps.tasks.models import Assignment
    from .utils import calculate_score

    # 🔹 Parse task location
    try:
        task_lat, task_lon = map(float, task.location.split(","))
    except:
        task_lat, task_lon = None, None

    # 🔹 Busy volunteers
    busy_volunteers = Assignment.objects.filter(
        status="accepted"
    ).values_list("volunteer_id", flat=True)

    volunteers = Volunteer.objects.filter(availability=True)
    volunteers = volunteers.exclude(id__in=busy_volunteers)

    results = []

    for v in volunteers:

        # 🔹 Skip if no lat/lon
        if not v.latitude or not v.longitude or not task_lat:
            continue

        # 🔹 Distance
        distance = calculate_distance(
            task_lat, task_lon,
            v.latitude, v.longitude
        )

        # 🔹 Filter far volunteers (>10km)
        if distance > 10:
            continue

        # 🔹 Base score
        base_score = calculate_score(task, v)

        # 🔹 Distance score
        distance_score = get_distance_score(distance)

        # 🔹 Performance score
        performance_score = get_performance_score(v)

        # 🔹 Final score
        final_score = base_score + distance_score + performance_score

        results.append({
            "volunteer_id": v.id,
            "name": v.user.name,
            "skills": v.skills,
            "location": v.location,
            "distance_km": round(distance, 2),
            "score": round(final_score, 2)
        })

    top_candidates = results[:5]

    refined = gemini_refine_scores(task, top_candidates)

    # 🔹 Apply refined scores (if available)
    if refined:
        name_to_score = {r["name"]: r["score"] for r in refined}

        for v in results:
            if v["name"] in name_to_score:
                v["score"] = name_to_score[v["name"]]

        results.sort(key=lambda x: x["score"], reverse=True)
    return results