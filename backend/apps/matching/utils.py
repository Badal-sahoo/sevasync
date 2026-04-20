import math
import os
import re
import json
import signal
from google import genai


# ==============================
# 🔹 CONFIG
# ==============================
API_KEY = os.getenv("AI_API_KEY")
USE_GEMINI = os.getenv("USE_GEMINI", "true") == "true"

client = None
if API_KEY and USE_GEMINI:
    client = genai.Client(api_key=API_KEY)


# ==============================
# 🔹 BASE SCORE
# ==============================
def calculate_score(task, volunteer):
    score = 0

    task_needs = task.need_type.lower()
    if isinstance(volunteer.skills, list):
        volunteer_skills = " ".join(volunteer.skills).lower()
    else:
        volunteer_skills = str(volunteer.skills).lower()

    # Skill Matching (40)
    if task_needs in volunteer_skills:
        score += 40
    else:
        task_keywords = task_needs.split()
        matches = sum(1 for word in task_keywords if word in volunteer_skills)
        if matches > 0:
            score += 20

    # Urgency (20)
    if task.urgency.lower() == "high":
        score += 20
    elif task.urgency.lower() == "medium":
        score += 10

    return score


# ==============================
# 🔹 DISTANCE (Haversine)
# ==============================
def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371  # KM

    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))

    return R * c


# ==============================
# 🔹 PERFORMANCE SCORE
# ==============================
def get_performance_score(volunteer):
    from apps.tasks.models import Assignment

    total = Assignment.objects.filter(volunteer=volunteer).count()
    completed = Assignment.objects.filter(
        volunteer=volunteer, status="completed"
    ).count()

    if total == 0:
        return 0

    return (completed / total) * 20


# ==============================
# 🔹 DISTANCE SCORE
# ==============================
def get_distance_score(distance):
    if distance <= 2:
        return 20
    elif distance <= 5:
        return 15
    elif distance <= 10:
        return 10
    else:
        return 0


# ==============================
# 🔹 GEMINI REFINEMENT (SAFE)
# ==============================
def gemini_refine_scores(task, candidates):
    if not client:
        return None

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

        # 🔥 TIMEOUT PROTECTION (3 sec max)
        def timeout_handler(signum, frame):
            raise Exception("Gemini timeout")

        signal.signal(signal.SIGALRM, timeout_handler)
        signal.alarm(3)

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )

        signal.alarm(0)

        text = response.text.strip()

        # 🔹 Extract JSON safely
        match = re.search(r"\[.*\]", text, re.DOTALL)
        if not match:
            return None

        return json.loads(match.group())

    except Exception as e:
        print("Gemini error:", e)
        return None


# ==============================
# 🔹 MAIN MATCHING FUNCTION
# ==============================
def get_matched_volunteers(task):
    from apps.volunteers.models import Volunteer
    from apps.tasks.models import Assignment

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

        # Skip invalid location
        if not v.latitude or not v.longitude or not task_lat:
            continue

        # 🔹 Distance
        distance = calculate_distance(
            task_lat, task_lon,
            v.latitude, v.longitude
        )

        # 🔹 Filter far (>10km)
        if distance > 10:
            continue

        # 🔹 Scores
        base_score = calculate_score(task, v)
        distance_score = get_distance_score(distance)
        performance_score = get_performance_score(v)

        final_score = base_score + distance_score + performance_score

        results.append({
            "volunteer_id": v.id,
            "name": v.user.name,
            "skills": v.skills,
            "location": v.location,
            "distance_km": round(distance, 2),
            "score": round(final_score, 2)
        })

    # ✅ Always sort FIRST
    results.sort(key=lambda x: x["score"], reverse=True)

    # 🔹 Top candidates for AI
    top_candidates = results[:5]

    # 🔥 Gemini (safe call)
    refined = None
    if USE_GEMINI:
        refined = gemini_refine_scores(task, top_candidates)

    # 🔹 Apply AI scores if available
    if refined and isinstance(refined, list):
        name_to_score = {r["name"]: r["score"] for r in refined}

        for v in results:
            if v["name"] in name_to_score:
                v["score"] = name_to_score[v["name"]]

        results.sort(key=lambda x: x["score"], reverse=True)
    else:
        print("Using base scoring (Gemini failed or skipped)")

    # 🔹 Final output
    return results[:10]