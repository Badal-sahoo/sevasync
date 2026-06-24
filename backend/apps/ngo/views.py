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
        return Response({
            "total_requests": Need.objects.filter(ngo=user).count(),
            "total_tasks": Task.objects.filter(ngo=user).count(),
            "completed_tasks": Task.objects.filter(ngo=user, status="completed").count(),
            "urgent_tasks": Task.objects.filter(ngo=user, urgency="HIGH").count(),
            "active_volunteers": Assignment.objects.filter(
                task__ngo=user
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

    data = []
    for t in tasks:
        # Only surface a volunteer who is actually engaged (requested/accepted) —
        # never a stale rejected/withdrawn/cancelled assignment.
        assignment = (
            Assignment.objects
            .filter(task=t, status__in=("requested", "accepted"))
            .select_related("volunteer__user")
            .first()
        )
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
