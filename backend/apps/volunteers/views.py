from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Volunteer
from .serializers import VolunteerSerializer
from apps.tasks.models import Task, Assignment
from apps.users.permissions import IsVolunteer


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsVolunteer])
def create_volunteer(request):
    try:
        if Volunteer.objects.filter(user=request.user).exists():
            return Response({"error": "Volunteer already exists"}, status=400)

        serializer = VolunteerSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response({"message": "Volunteer created successfully"})

        return Response(serializer.errors, status=400)

    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsVolunteer])
def volunteer_dashboard(request):
    try:
        volunteer = Volunteer.objects.get(user=request.user)
    except Volunteer.DoesNotExist:
        return Response({"error": "Volunteer not found"}, status=404)

    total_assigned = Assignment.objects.filter(volunteer=volunteer).count()
    completed_tasks = volunteer.tasks_completed

    active_tasks = Task.objects.filter(
        assignments__volunteer=volunteer,
        assignments__status="accepted"
    ).distinct()

    active_list = [
        {
            "task_id": t.id,
            "type": t.need_type,
            "location": t.location_name or "Unknown",
            "urgency": t.urgency,
            "total_people": t.people_count,
            "status": "accepted",
        }
        for t in active_tasks
    ]

    requested_tasks = Assignment.objects.filter(volunteer=volunteer, status="requested")

    request_list = [
        {
            "task_id": a.task.id,
            "type": a.task.need_type,
            "location": a.task.location_name or "Unknown",
            "urgency": a.task.urgency,
            "total_people": a.task.people_count,
            "status": a.status,
        }
        for a in requested_tasks
    ]

    return Response({
        "name": volunteer.user.name,
        "skills": volunteer.skills,
        "total_assigned": total_assigned,
        "completed_tasks": completed_tasks,
        "active_tasks": active_list,
        "requested_tasks": request_list,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsVolunteer])
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
        "latitude": volunteer.latitude,
        "longitude": volunteer.longitude,
        "availability": volunteer.availability,
        "total_points": volunteer.total_points,
        "tasks_completed": volunteer.tasks_completed,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsVolunteer])
def volunteer_points_view(request):
    try:
        volunteer = Volunteer.objects.get(user=request.user)
    except Volunteer.DoesNotExist:
        return Response({"error": "Volunteer not found"}, status=404)

    return Response({
        "name": volunteer.user.name,
        "total_points": volunteer.total_points,
        "tasks_completed": volunteer.tasks_completed,
    })


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsVolunteer])
def update_volunteer_profile(request):
    try:
        volunteer = Volunteer.objects.get(user=request.user)
    except Volunteer.DoesNotExist:
        return Response({"error": "Volunteer not found"}, status=404)

    data = request.data.copy()

    if isinstance(data.get("skills"), dict):
        nested = data.get("skills")
        data["skills"] = nested.get("skills", [])
        data["location"] = nested.get("location")

    lat = data.get("latitude")
    lng = data.get("longitude")

    if lat is not None and lng is not None:
        # Map picker supplied coordinates directly — skip geopy entirely
        pass
    elif data.get("location"):
        # Fallback: geocode free-text location (legacy path for non-map clients)
        try:
            import ssl, certifi
            from geopy.geocoders import Nominatim

            ctx = ssl.create_default_context(cafile=certifi.where())
            geolocator = Nominatim(user_agent="sevasync_app_123", ssl_context=ctx, timeout=10)
            geo = geolocator.geocode(data["location"])

            if geo:
                data["latitude"] = geo.latitude
                data["longitude"] = geo.longitude
            else:
                return Response({"error": "Invalid location name"}, status=400)

        except Exception as e:
            print("Geocoding error:", e)
            return Response({"error": "Location service failed"}, status=500)

    serializer = VolunteerSerializer(volunteer, data=data, partial=True)

    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Profile updated successfully", "data": serializer.data})

    return Response(serializer.errors, status=400)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsVolunteer])
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
