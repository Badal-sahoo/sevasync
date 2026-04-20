from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Volunteer
from .serializers import VolunteerSerializer
from apps.tasks.models import Task, Assignment

from geopy.geocoders import Nominatim
import ssl
import certifi

# ==============================
# 🆕 CREATE VOLUNTEER
# ==============================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_volunteer(request):
    try:
        # Prevent duplicate volunteer creation
        if Volunteer.objects.filter(user=request.user).exists():
            return Response({"error": "Volunteer already exists"}, status=400)

        serializer = VolunteerSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response({"message": "Volunteer created successfully"})

        return Response(serializer.errors, status=400)

    except Exception as e:
        return Response({"error": str(e)}, status=500)


# ==============================
# 📊 DASHBOARD
# ==============================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def volunteer_dashboard(request):
    try:
        volunteer = Volunteer.objects.get(user=request.user)
    except Volunteer.DoesNotExist:
        return Response({"error": "Volunteer not found"}, status=404)

    assigned_tasks = Assignment.objects.filter(volunteer=volunteer)
    total_assigned = assigned_tasks.count()

    completed_tasks = volunteer.tasks_completed

    active_tasks = Task.objects.filter(
        assignments__volunteer=volunteer,
        assignments__status="accepted"
    ).distinct()
 
    active_list = [
        {
            "task_id": t.id,
            "type": t.need_type,
            "location": t.location,
            "location_name": t.location_name,   # ✅ ADD
            "urgency": t.urgency,
            "people": t.total_needs,
            "status": "accepted"                # ✅ ADD
        }
        for t in active_tasks
    ]

    requested_tasks = Assignment.objects.filter(
        volunteer=volunteer,
        status="requested"
    )

    request_list = [
        {
            "task_id": a.task.id,
            "type": a.task.need_type,
            "location": a.task.location,
            "location_name": a.task.location_name,  # ✅ ADD
            "urgency": a.task.urgency,
            "people": a.task.total_needs,
            "status": a.status                     # ✅ CRITICAL
        }
        for a in requested_tasks
    ]

    return Response({
        "name": volunteer.user.name,
        "skills": volunteer.skills,
        "total_assigned": total_assigned,
        "completed_tasks": completed_tasks,
        "active_tasks": active_list,
        "requested_tasks": request_list
    })


# ==============================
# 👤 PROFILE
# ==============================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_volunteer_profile(request):
    try:
        volunteer = Volunteer.objects.get(user=request.user)
    except Volunteer.DoesNotExist:
        return Response({"error": "Volunteer not found"}, status=404)

    return Response({
        "name": volunteer.user.name,
        "email": volunteer.user.email,
        "skills": volunteer.skills,
        "location": volunteer.location,
        "availability": volunteer.availability,
        "points": volunteer.points,
        "tasks_completed": volunteer.tasks_completed
    })


# ==============================
# 🏆 POINTS & BADGES
# ==============================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def volunteer_points_view(request):
    try:
        volunteer = Volunteer.objects.get(user=request.user)

        badges = []

        # Points-based badges
        if volunteer.points >= 500:
            badges.append("Elite Responder 🏆")
        elif volunteer.points >= 300:
            badges.append("Community Star 🌟")
        elif volunteer.points >= 100:
            badges.append("Rising Helper ✨")

        # Task-based badges
        if volunteer.tasks_completed >= 20:
            badges.append("Disaster Hero 🚑")
        elif volunteer.tasks_completed >= 10:
            badges.append("Field Expert ⚡")
        elif volunteer.tasks_completed >= 5:
            badges.append("Veteran Responder 🛡️")

        # Urgency-based badge
        high_tasks = Assignment.objects.filter(
            volunteer=volunteer,
            task__urgency="HIGH",
            status="completed"
        ).count()

        if high_tasks >= 5:
            badges.append("Crisis Warrior 🔥")

        return Response({
            "name": volunteer.user.name,
            "total_points": volunteer.points,
            "tasks_completed": volunteer.tasks_completed,
            "badges": badges
        })

    except Volunteer.DoesNotExist:
        return Response({"error": "Volunteer not found"}, status=404)


# ==============================
# 📈 PERFORMANCE
# ==============================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def volunteer_performance(request):
    try:
        volunteer = Volunteer.objects.get(user=request.user)
    except Volunteer.DoesNotExist:
        return Response({"error": "Volunteer not found"}, status=404)

    completed = Assignment.objects.filter(
        volunteer=volunteer,
        status="completed"
    )

    total_completed = completed.count()

    high = completed.filter(task__urgency="HIGH").count()
    medium = completed.filter(task__urgency="MEDIUM").count()
    low = completed.filter(task__urgency="LOW").count()

    total_assigned = Assignment.objects.filter(volunteer=volunteer).count()

    efficiency = 0
    if total_assigned > 0:
        efficiency = round((total_completed / total_assigned) * 100, 2)

    return Response({
        "name": volunteer.user.name,
        "total_completed": total_completed,
        "urgency_breakdown": {
            "high": high,
            "medium": medium,
            "low": low
        },
        "efficiency_percent": efficiency
    })


# ==============================
# ✏️ UPDATE PROFILE
# ==============================


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_volunteer_profile(request):
    try:
        volunteer = Volunteer.objects.get(user=request.user)
    except Volunteer.DoesNotExist:
        return Response({"error": "Volunteer not found"}, status=404)

    data = request.data.copy()

    # 🔥 NEW: Convert location → lat/lon
    location = data.get("location")

    if location:
        try:
            ctx = ssl.create_default_context(cafile=certifi.where())

            geolocator = Nominatim(
                user_agent="sevasync",
                ssl_context=ctx,
                timeout=5
            )

            geo = geolocator.geocode(location)

            if geo:
                data["latitude"] = geo.latitude
                data["longitude"] = geo.longitude
            else:
                return Response(
                    {"error": "Invalid location name"},
                    status=400
                )

        except Exception as e:
            print("Geocoding error:", e)
            return Response(
                {"error": "Location service failed"},
                status=500
            )

    serializer = VolunteerSerializer(
        volunteer,
        data=data,
        partial=True
    )

    if serializer.is_valid():
        serializer.save()
        return Response({
            "message": "Profile updated successfully",
            "data": serializer.data
        })

    return Response(serializer.errors, status=400)


# ==============================
# 🔘 AVAILABILITY
# ==============================
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_availability(request):
    try:
        volunteer = Volunteer.objects.get(user=request.user)
    except Volunteer.DoesNotExist:
        return Response({"error": "Volunteer not found"}, status=404)

    availability = request.data.get("availability")

    if availability is None:
        return Response({"error": "Availability required"}, status=400)

    volunteer.availability = availability
    volunteer.save()

    return Response({"message": "Availability updated"})