from apps.tasks.models import Task, Assignment
from apps.volunteers.models import Volunteer
from apps.notifications.utils import send_push


def assign_volunteer(task_id, volunteer_id):
    try:
        task = Task.objects.get(id=task_id)
        volunteer = Volunteer.objects.get(id=volunteer_id)
    except Exception:
        raise ValueError("Invalid task or volunteer ID")

    if Assignment.objects.filter(task=task, volunteer=volunteer).exists():
        raise ValueError("Request already sent")

    if Assignment.objects.filter(volunteer=volunteer, status="accepted").exists():
        raise ValueError("Volunteer already busy")

    Assignment.objects.create(task=task, volunteer=volunteer, status="requested")
    task.status = "requested"
    task.save()

    send_push(
        volunteer.fcm_token,
        "New Task Request",
        f"You have been requested for a {task.need_type} task at {task.location_name or 'your area'}.",
    )


def respond_to_assignment(task_id, volunteer, action):
    assignment = Assignment.objects.filter(task_id=task_id, volunteer=volunteer).first()

    if not assignment:
        raise ValueError("Assignment not found")

    if assignment.status == "accepted" and action == "reject":
        raise ValueError("Cannot reject after accepting")

    if action == "accept":
        already_active = Assignment.objects.filter(
            volunteer=volunteer, status="accepted"
        ).exclude(id=assignment.id).exists()

        if already_active:
            raise ValueError("You already have an active task")

        assignment.status = "accepted"
        assignment.save()

        task = assignment.task
        task.status = "assigned"
        task.save()

        send_push(
            task.ngo.fcm_token,
            "Volunteer Accepted",
            f"{volunteer.user.name} accepted your {task.need_type} task.",
        )

        other_assignments = Assignment.objects.filter(
            volunteer=volunteer, status="requested"
        ).exclude(id=assignment.id).select_related('task__ngo')

        for other in other_assignments:
            send_push(
                other.task.ngo.fcm_token,
                "Assignment Auto-Rejected",
                f"Your request for a {other.task.need_type} task was declined — the volunteer accepted another task.",
            )

        other_assignments.update(status="rejected")

    elif action == "reject":
        assignment.status = "rejected"
        assignment.save()

        # Return the task to the pool so the NGO can re-assign it, unless another
        # volunteer is still requested/accepted for it. Without this the task gets
        # stuck in "requested" forever after a rejection.
        task = assignment.task
        still_active = Assignment.objects.filter(
            task=task, status__in=("requested", "accepted")
        ).exclude(id=assignment.id).exists()
        if not still_active and task.status == "requested":
            task.status = "pending"
            task.save()

        send_push(
            task.ngo.fcm_token,
            "Volunteer Declined",
            f"A volunteer declined your {task.need_type} task.",
        )

    else:
        raise ValueError("Invalid action. Must be 'accept' or 'reject'")


def withdraw_assignment(assignment_id, volunteer):
    """Volunteer withdraws from an assignment they own. Task reverts to pending."""
    try:
        assignment = Assignment.objects.select_related('task__ngo').get(
            id=assignment_id, volunteer=volunteer
        )
    except Assignment.DoesNotExist:
        raise LookupError("Assignment not found")

    if assignment.status not in ('requested', 'accepted'):
        raise ValueError("Cannot withdraw from this assignment")

    task = assignment.task
    assignment.status = "withdrawn"
    assignment.save()

    task.status = "pending"
    task.save()

    send_push(
        task.ngo.fcm_token,
        "Volunteer Withdrew",
        f"A volunteer withdrew from your {task.need_type} task at {task.location_name or 'your area'}.",
    )
