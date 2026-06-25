from django.db import transaction
from django.db.models import F

from apps.tasks.models import Task, Assignment
from apps.volunteers.models import Volunteer
from core.constants.rewards import POINTS_HIGH, POINTS_MEDIUM, POINTS_LOW

_POINTS = {"high": POINTS_HIGH, "medium": POINTS_MEDIUM}


def complete_task_and_reward(task_id, requesting_user):
    """Mark task completed and award points to all assigned volunteers. Returns rewarded count.

    Runs in a single transaction with set-based updates so completing a task with N
    volunteers costs a constant ~3 queries (was 2N+1: one save per assignment + one
    per volunteer) and can never leave a partially-rewarded state.
    """
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        raise LookupError("Task not found")

    if task.ngo != requesting_user:
        raise PermissionError("Not authorized")

    if task.status == "completed":
        return 0

    volunteer_ids = list(
        Assignment.objects.filter(task=task, status="accepted")
        .values_list("volunteer_id", flat=True)
    )

    if not volunteer_ids:
        raise ValueError("No volunteers assigned")

    points = _POINTS.get(task.urgency.lower(), POINTS_LOW)

    with transaction.atomic():
        task.status = "completed"
        task.save(update_fields=["status"])

        Assignment.objects.filter(task=task, status="accepted").update(status="completed")

        # Every volunteer on this task earns the same urgency-based points → one
        # set-based update with F() expressions instead of a save per volunteer.
        Volunteer.objects.filter(id__in=volunteer_ids).update(
            total_points=F("total_points") + points,
            tasks_completed=F("tasks_completed") + 1,
        )

    return len(volunteer_ids)


def cancel_task(task_id, requesting_user):
    """NGO cancels a task. All pending/accepted assignments are cancelled; volunteers are notified."""
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        raise LookupError("Task not found")

    if task.ngo != requesting_user:
        raise PermissionError("Not authorized")

    if task.status in ('completed', 'cancelled'):
        raise ValueError("Task cannot be cancelled")

    Assignment.objects.filter(
        task=task, status__in=('requested', 'accepted')
    ).update(status="cancelled")

    task.status = "cancelled"
    task.save()
