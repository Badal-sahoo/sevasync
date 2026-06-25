from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Task, Assignment
from apps.volunteers.models import Volunteer
from apps.users.permissions import IsNGO, IsVolunteer
from . import services


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_task_detail(request, task_id):
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return Response({"error": "Task not found"}, status=404)

    assignments = Assignment.objects.filter(task=task).select_related('volunteer', 'volunteer__user')

    accepted_volunteers = []
    requested_volunteers = []

    for a in assignments:
        data = {
            "id": a.volunteer.id,
            "name": a.volunteer.user.name,
            "status": a.status,
        }
        if a.status == "accepted":
            data["phone_number"] = a.volunteer.phone_number
            accepted_volunteers.append(data)
        elif a.status == "requested":
            requested_volunteers.append(data)

    return Response({
        "task_id": task.id,
        "need_type": task.need_type,
        "location": task.location_name or "Unknown",
        "urgency": task.urgency,
        "total_people": task.people_count,
        "status": task.status,
        # Multiple volunteers can work one task. `accepted_volunteer` is kept as a
        # convenience (first accepted) for backward compatibility.
        "accepted_volunteers": accepted_volunteers,
        "accepted_volunteer": accepted_volunteers[0] if accepted_volunteers else None,
        "requested_volunteers": requested_volunteers,
        "can_assign": task.status not in ("completed", "cancelled"),
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsNGO])
def assign_task(request, task_id):
    volunteer_id = request.data.get("volunteer_id")

    if not volunteer_id:
        return Response({"error": "volunteer_id required"}, status=400)

    try:
        services.assign_volunteer(task_id, volunteer_id)
    except ValueError as e:
        return Response({"error": str(e)}, status=400)

    return Response({"message": "Request sent to volunteer"})


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsVolunteer])
def respond_task(request, task_id):
    action = request.data.get("action")

    if not action:
        return Response({"error": "action required"}, status=400)

    try:
        volunteer = Volunteer.objects.get(user=request.user)
    except Volunteer.DoesNotExist:
        return Response({"error": "Volunteer not found"}, status=404)

    try:
        services.respond_to_assignment(task_id, volunteer, action)
    except ValueError as e:
        return Response({"error": str(e)}, status=400)

    return Response({"message": f"Task {action}ed"})


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def task_progress(request, task_id):
    if request.method == 'POST':
        if not IsVolunteer().has_permission(request, None):
            from rest_framework.response import Response as R
            return R({"error": "Only volunteers can post progress updates"}, status=403)
        message = request.data.get("message")

        if not message:
            return Response({"error": "message required"}, status=400)

        try:
            volunteer = Volunteer.objects.get(user=request.user)
            services.add_progress_update(task_id, volunteer, message)
        except Volunteer.DoesNotExist:
            return Response({"error": "Volunteer not found"}, status=404)
        except PermissionError as e:
            return Response({"error": str(e)}, status=403)

        return Response({"message": "Update added"})

    try:
        data = services.get_task_progress(task_id)
    except LookupError as e:
        return Response({"error": str(e)}, status=404)

    return Response(data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsVolunteer])
def withdraw_assignment(request, assignment_id):
    try:
        volunteer = Volunteer.objects.get(user=request.user)
    except Volunteer.DoesNotExist:
        return Response({"error": "Volunteer not found"}, status=404)

    try:
        services.withdraw_assignment(assignment_id, volunteer)
    except LookupError as e:
        return Response({"error": str(e)}, status=404)
    except ValueError as e:
        return Response({"error": str(e)}, status=400)

    return Response({"message": "Withdrawn successfully"})


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsNGO])
def cancel_task(request, task_id):
    try:
        services.cancel_task(task_id, request.user)
    except LookupError as e:
        return Response({"error": str(e)}, status=404)
    except PermissionError as e:
        return Response({"error": str(e)}, status=403)
    except ValueError as e:
        return Response({"error": str(e)}, status=400)

    return Response({"message": "Task cancelled"})


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsNGO])
def complete_task(request, task_id):
    try:
        rewarded = services.complete_task_and_reward(task_id, request.user)
    except LookupError as e:
        return Response({"error": str(e)}, status=404)
    except PermissionError as e:
        return Response({"error": str(e)}, status=403)
    except ValueError as e:
        return Response({"error": str(e)}, status=400)

    return Response({
        "message": "Task completed successfully",
        "volunteers_rewarded": rewarded,
    })
