from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Task, Assignment,TaskUpdate
from apps.ai.models import Need
from apps.volunteers.models import Volunteer
from apps.users.models import User
import ssl
import certifi
from geopy.geocoders import Nominatim

def convert_location(lat, lon):
    try:
        ctx = ssl.create_default_context(cafile=certifi.where())

        geolocator = Nominatim(
            user_agent="sevasync",
            ssl_context=ctx
        )

        location = geolocator.reverse(f"{lat}, {lon}", language="en")

        if location and location.raw.get("address"):
            address = location.raw["address"]

            area = (
                address.get("suburb")
                or address.get("neighbourhood")
                or address.get("village")
            )

            city = (
                address.get("city")
                or address.get("town")
                or address.get("state")
            )

            if area and city:
                return f"{area}, {city}"
            elif city:
                return city

        return "Unknown location"

    except Exception as e:
        print("Location error:", e)
        return None


@api_view(['POST'])
def create_task(request):
    try:
        user = request.user   # 🔥 logged-in NGO

        need_id = request.data.get('need_id')
        if not need_id:
            return Response({"error": "need_id required"}, status=400)

        need = Need.objects.get(id=need_id)

        raw_location = request.data.get('location')  # "lat,lng"

        location_name = None

        try:
            lat, lon = map(float, raw_location.split(","))
            location_name = convert_location(lat, lon)
        except:
            pass

        task = Task.objects.create(
            ngo=user,
            need=need,
            title=request.data.get('title'),
            location=raw_location,
            location_name=location_name,  
            urgency=request.data.get('urgency')
        )

        return Response({"task_id": task.id})

    except Need.DoesNotExist:
        return Response({"error": "Invalid need_id"}, status=404)

    except Exception as e:
        print("🔥 CREATE TASK ERROR:", str(e))
        return Response({"error": str(e)}, status=500)


@api_view(['POST'])
def assign_task(request):
    task_id = request.data.get("task_id")
    volunteer_id = request.data.get("volunteer_id")

    if not task_id or not volunteer_id:
        return Response({"error": "task_id and volunteer_id required"}, status=400)

    try:
        task = Task.objects.get(id=task_id)
        volunteer = Volunteer.objects.get(id=volunteer_id)
    except:
        return Response({"error": "Invalid IDs"}, status=400)

    # 1. Duplicate check
    if Assignment.objects.filter(task=task, volunteer=volunteer).exists():
        return Response({"error": "Request already sent"}, status=400)

    # 2. Busy check
    if Assignment.objects.filter(volunteer=volunteer, status="accepted").exists():
        return Response({"error": "Volunteer already busy"}, status=400)

    # 🔥 CREATE REQUEST (not assignment yet)
    Assignment.objects.create(
        task=task,
        volunteer=volunteer,
        status="requested"
    )

    # 🔥 Update task status
    task.status = "requested"
    task.save()

    return Response({
        "message": "Request sent to volunteer"
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_status(request):
    """
    Updates task status to completed and awards points to the assigned volunteer.
    """
    task_id = request.data.get('task_id')
    status = request.data.get('status')
    
    try:
        task = Task.objects.get(id=task_id)
        
        # Check if we are marking it as completed
        if status == "completed" and task.status != "completed":

            assignments = Assignment.objects.filter(
                task=task,
                status="accepted"
            ).select_related("volunteer")

            if not assignments.exists():
                return Response({"error": "No volunteers assigned"}, status=400)

            task.status = "completed"
            task.save()

            for assignment in assignments:
                volunteer = assignment.volunteer

                assignment.status = "completed"
                assignment.save()

                # 🎯 Points logic
                points_awarded = 0
                if task.urgency.lower() == 'high':
                    points_awarded = 50
                elif task.urgency.lower() == 'medium':
                    points_awarded = 25
                else:
                    points_awarded = 10

                volunteer.points += points_awarded
                volunteer.tasks_completed += 1
                volunteer.save()

            return Response({
                "message": f"Task completed! {assignments.count()} volunteers rewarded."
            })
            
        return Response({"message": "Status updated without point changes."})

    except Task.DoesNotExist:
        return Response({"error": "Task not found."}, status=404)
    except Assignment.DoesNotExist:
        return Response({"error": "Cannot complete task: No volunteer assigned."}, status=400)



@api_view(['POST'])
def respond_task(request):
    task_id = request.data.get("task_id")
    action = request.data.get("action")

    if not task_id or not action:
        return Response({"error": "task_id and action required"}, status=400)

    try:
        volunteer = Volunteer.objects.get(user=request.user)
    except Volunteer.DoesNotExist:
        return Response({"error": "Volunteer not found"}, status=404)

    assignment = Assignment.objects.filter(
        task_id=task_id,
        volunteer=volunteer
    ).first()

    if not assignment:
        return Response({"error": "Assignment not found"}, status=400)

    # ❌ Prevent rejecting after accepting
    if assignment.status == "accepted" and action == "reject":
        return Response({"error": "Cannot reject after accepting"}, status=400)

    # =========================
    # ✅ ACCEPT
    # =========================
    if action == "accept":

        # ❌ Check if already working on another task
        already_accepted = Assignment.objects.filter(
            volunteer=volunteer,
            status="accepted"
        ).exclude(id=assignment.id).exists()

        if already_accepted:
            return Response({"error": "You already have an active task"}, status=400)

        # ✅ Accept this task
        assignment.status = "accepted"
        assignment.save()

        assignment.task.status = "assigned"
        assignment.task.save()

        # 🔥 Reject other tasks for this volunteer
        Assignment.objects.filter(
            volunteer=volunteer
        ).exclude(id=assignment.id).update(status="rejected")

        return Response({"message": "Task accepted"})

    # =========================
    # ❌ REJECT
    # =========================
    elif action == "reject":
        assignment.status = "rejected"
        assignment.save()

        return Response({"message": "Task rejected"})

    return Response({"error": "Invalid action"}, status=400)



@api_view(['GET'])
def get_task_detail(request, task_id):
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return Response({"error": "Task not found"}, status=404)

    # Check assignment
    assignments = Assignment.objects.filter(task=task).select_related('volunteer')

    accepted_volunteer = None
    requested_volunteers = []

    for a in assignments:
        data = {
            "id": a.volunteer.id,
            "name": getattr(a.volunteer, "name", ""),
            "status": a.status
        }

        if a.status == "accepted":
            accepted_volunteer = data
        elif a.status == "requested":
            requested_volunteers.append(data)


    return Response({
        "task_id": task.id,
        "need_type": task.need_type,
        "location": task.location_name if task.location_name else task.location,
        "urgency": task.urgency,
        "total_needs": task.total_needs,
        "status": task.status,
        "accepted_volunteer": accepted_volunteer,
        "requested_volunteers": requested_volunteers
    })

@api_view(['POST'])
def add_update(request):
    task_id = request.data.get("task_id")
    message = request.data.get("message")

    if not task_id or not message:
        return Response({"error": "task_id and message required"}, status=400)

    volunteer = Volunteer.objects.get(user=request.user)

    assignment = Assignment.objects.filter(
        task_id=task_id,
        volunteer=volunteer,
        status="accepted"
    ).first()

    if not assignment:
        return Response({"error": "You are not assigned to this task"}, status=403)

    TaskUpdate.objects.create(
        task_id=task_id,
        volunteer=volunteer,
        message=message
    )

    return Response({"message": "Update added"})

@api_view(['GET'])
def get_updates(request):
    task_id = request.GET.get("task_id")

    if not task_id:
        return Response({"error": "task_id required"}, status=400)

    updates = TaskUpdate.objects.filter(
        task_id=task_id
    ).select_related("volunteer")

    data = []
    for u in updates:
        data.append({
            "name": getattr(u.volunteer, "name", ""),
            "message": u.message,
            "time": u.created_at
        })

    return Response(data)

from rest_framework.permissions import IsAuthenticated

@api_view(['POST'])
def update_taskstatus(request):
    task_id = request.data.get('task_id')
    status = request.data.get('status')

    if not task_id or not status:
        return Response({"error": "task_id and status required"}, status=400)

    try:
        task = Task.objects.get(id=task_id)

        # 🔒 Ensure only NGO who created task can complete it
        if task.ngo != request.user:
            return Response({"error": "Not authorized"}, status=403)

        # ✅ Only allow completion
        if status == "completed":

            if task.status == "completed":
                return Response({"message": "Task already completed"})

            # 🔥 Get ALL accepted volunteers
            assignments = Assignment.objects.filter(
                task=task,
                status="accepted"
            ).select_related("volunteer")

            if not assignments.exists():
                return Response({"error": "No volunteers assigned"}, status=400)

            # ✅ Mark task completed
            task.status = "completed"
            task.save()

            total_volunteers = 0

            for assignment in assignments:
                volunteer = assignment.volunteer

                # ✅ Mark assignment completed
                assignment.status = "completed"
                assignment.save()

                # 🎯 Points logic
                if task.urgency.lower() == 'high':
                    points = 50
                elif task.urgency.lower() == 'medium':
                    points = 25
                else:
                    points = 10

                volunteer.points += points
                volunteer.tasks_completed += 1
                volunteer.save()

                total_volunteers += 1

            return Response({
                "message": "Task completed successfully",
                "volunteers_rewarded": total_volunteers
            })

        return Response({"error": "Invalid status"}, status=400)

    except Task.DoesNotExist:
        return Response({"error": "Task not found"}, status=404)