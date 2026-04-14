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