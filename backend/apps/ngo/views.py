from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.needs.models import Need
from apps.tasks.models import Task, Assignment
from apps.users.permissions import IsNGO


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsNGO])
def ngo_dashboard(request):
    try:
        user = request.user
        # "Total" and "Urgent" reflect OUTSTANDING work, so finishing a task moves
        # it out of those counters and into "Completed" (active + completed = all).
        _finished = ("completed", "cancelled")
        ngo_tasks = Task.objects.filter(ngo=user)
        return Response({
            "total_requests": Need.objects.filter(ngo=user).count(),
            "total_tasks": ngo_tasks.exclude(status__in=_finished).count(),
            "completed_tasks": ngo_tasks.filter(status="completed").count(),
            "urgent_tasks": ngo_tasks.filter(urgency="HIGH").exclude(status__in=_finished).count(),
            "active_volunteers": Assignment.objects.filter(
                task__ngo=user, status="accepted"
            ).values('volunteer').distinct().count(),
        })
    except Exception as e:
        print("NGO DASHBOARD ERROR:", str(e))
        return Response({
            "total_requests": 0, "total_tasks": 0, "completed_tasks": 0,
            "active_volunteers": 0, "urgent_tasks": 0,
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsNGO])
def ngo_requests(request):
    user = request.user
    urgency = request.GET.get("urgency")

    tasks = Task.objects.filter(ngo_id=user.id)

    if urgency:
        if urgency in ["HIGH", "MEDIUM", "LOW"]:
            tasks = tasks.filter(urgency=urgency)
        else:
            return Response({"error": "Invalid urgency value"}, status=400)

    tasks = list(tasks)
    task_ids = [t.id for t in tasks]

    # Fetch every engaged (requested/accepted) volunteer for all of these tasks in
    # ONE query and index it, instead of querying once per task (N+1 → 2 queries).
    active_by_task = {}
    for a in (
        Assignment.objects
        .filter(task_id__in=task_ids, status__in=("requested", "accepted"))
        .select_related("volunteer__user")
        .order_by("task_id", "id")
    ):
        active_by_task.setdefault(a.task_id, a)  # first engaged volunteer per task

    data = []
    for t in tasks:
        # Only surface a volunteer who is actually engaged — never a stale
        # rejected/withdrawn/cancelled assignment.
        assignment = active_by_task.get(t.id)
        volunteer_data = None
        if assignment:
            v = assignment.volunteer
            volunteer_data = {"volunteer_id": v.id, "name": v.user.name, "skills": v.skills}

        data.append({
            "id": t.id,
            "type": t.need_type,
            "location": t.location_name or "Unknown",
            "urgency": t.urgency,
            "total_people": t.people_count,
            "status": t.status,
            "assigned_volunteer": volunteer_data,
        })

    return Response(data)
