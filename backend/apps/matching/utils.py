def calculate_score(task, volunteer):
    score = 0

    # 🔹 Skill match
    task_type = task.need_type.lower()  # ✅ FIXED
    skills = [s.lower() for s in volunteer.skills]

    if task_type in skills:
        score += 50
    elif any(task_type in s for s in skills):
        score += 30

    # 🔹 Urgency
    if task.urgency.upper() == "HIGH":   # ✅ consistency fix
        score += 30
    elif task.urgency.upper() == "MEDIUM":
        score += 20
    else:
        score += 10

    # 🔹 Location match
    if volunteer.location and task.location:
        if volunteer.location.lower() == task.location.lower():
            score += 20
        else:
            score += 10

    return score
# matching/utils.py

def get_matched_volunteers(task):
    from apps.volunteers.models import Volunteer
    from apps.tasks.models import Assignment
    from .utils import calculate_score  # already exists

    busy_volunteers = Assignment.objects.filter(
        status="accepted"
    ).values_list("volunteer_id", flat=True)

    volunteers = Volunteer.objects.filter(availability=True)
    volunteers = volunteers.exclude(id__in=busy_volunteers)

    results = []

    for v in volunteers:
        score = calculate_score(task, v)

        results.append({
            "volunteer_id": v.id,
            "name": v.user.name,
            "skills": v.skills,
            "location": v.location,
            "availability": v.availability,
            "score": round(score, 2)
        })

    results.sort(key=lambda x: x["score"], reverse=True)

    return results