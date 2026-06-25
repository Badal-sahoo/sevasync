from apps.tasks.models import Task, Assignment
from apps.volunteers.models import Volunteer


def assign_volunteer(task_id, volunteer_id):
    try:
        task = Task.objects.get(id=task_id)
        volunteer = Volunteer.objects.get(id=volunteer_id)
    except Exception:
        raise ValueError("Invalid task or volunteer ID")

    # A finished task must not accept new volunteers.
    if task.status in ("completed", "cancelled"):
        raise ValueError("Task is already finished and cannot take new volunteers")

    # An NGO may request several volunteers for the same task, but not the same
    # volunteer twice while a prior request is still live.
    if Assignment.objects.filter(
        task=task, volunteer=volunteer, status__in=("requested", "accepted")
    ).exists():
        raise ValueError("Request already sent to this volunteer")

    if Assignment.objects.filter(volunteer=volunteer, status="accepted").exists():
        raise ValueError("Volunteer already busy")

    Assignment.objects.create(task=task, volunteer=volunteer, status="requested")
    # Only advance pending → requested. Never downgrade a task that already has an
    # accepted volunteer (status "assigned") when more volunteers are requested.
    if task.status == "pending":
        task.status = "requested"
        task.save()


def respond_to_assignment(task_id, volunteer, action):
    # Target the live assignment (a volunteer may have older rejected rows for the
    # same task after re-requests); never act on a stale one.
    assignment = (
        Assignment.objects
        .filter(task_id=task_id, volunteer=volunteer, status__in=("requested", "accepted"))
        .order_by("-id")
        .first()
    )

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

        # The volunteer committed here, so withdraw their other open requests.
        Assignment.objects.filter(
            volunteer=volunteer, status="requested"
        ).exclude(id=assignment.id).update(status="rejected")

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

    else:
        raise ValueError("Invalid action. Must be 'accept' or 'reject'")


def withdraw_assignment(assignment_id, volunteer):
    """Volunteer withdraws from an assignment they own."""
    try:
        assignment = Assignment.objects.select_related('task').get(
            id=assignment_id, volunteer=volunteer
        )
    except Assignment.DoesNotExist:
        raise LookupError("Assignment not found")

    if assignment.status not in ('requested', 'accepted'):
        raise ValueError("Cannot withdraw from this assignment")

    task = assignment.task
    assignment.status = "withdrawn"
    assignment.save()

    # Only return the task to the pool if no other volunteer is still engaged
    # (supports multiple volunteers per task).
    still_active = Assignment.objects.filter(
        task=task, status__in=("requested", "accepted")
    ).exclude(id=assignment.id).exists()
    if not still_active:
        task.status = "pending"
        task.save()
