from apps.tasks.models import Task, Assignment, ProgressUpdate
from apps.matching.utils import get_matched_volunteers


def add_progress_update(task_id, volunteer, message):
    assignment = Assignment.objects.filter(
        task_id=task_id, volunteer=volunteer, status="accepted"
    ).first()

    if not assignment:
        raise PermissionError("You are not assigned to this task")

    ProgressUpdate.objects.create(task_id=task_id, volunteer=volunteer, message=message)


def get_task_progress(task_id):
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        raise LookupError("Task not found")

    updates = (
        ProgressUpdate.objects
        .filter(task_id=task_id)
        .select_related("volunteer__user")
        .order_by("-created_at")[:50]
    )

    updates_data = [
        {
            "type": "message",
            "name": u.volunteer.user.name if u.volunteer and u.volunteer.user else "Anonymous",
            "message": u.message,
            "time": u.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        }
        for u in updates
    ]

    match_warning = None
    if not task.latitude or not task.longitude:
        match_warning = "Task has no location — volunteer matching unavailable."
        results = []
    else:
        try:
            results = get_matched_volunteers(task)
            if not results:
                match_warning = "No available volunteers found within 10 km of this task."
        except Exception as e:
            print("Matching Error:", e)
            results = []
            match_warning = "Matching service error."

    return {
        "task": {
            "task_id": task.id,
            "type": task.need_type,
            "location": task.location_name or "Unknown",
            "urgency": task.urgency,
            "total_people": task.people_count,
        },
        "updates": updates_data,
        "recommended_volunteers": results[:5],
        "best_match": results[0] if results else None,
        "total_candidates": len(results),
        "match_warning": match_warning,
    }
