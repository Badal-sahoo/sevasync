from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Volunteer
from .serializers import VolunteerSerializer
from apps.tasks.models import Task, Assignment

@api_view(['POST'])
def create_volunteer(request):
    serializer = VolunteerSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Volunteer created"})
    return Response(serializer.errors)

@api_view(['GET'])
def volunteer_dashboard(request):
    volunteer_id = request.GET.get("volunteer_id")

    if not volunteer_id:
        return Response({"error": "volunteer_id required"}, status=400)

    try:
        volunteer = Volunteer.objects.get(id=volunteer_id)
    except:
        return Response({"error": "Invalid volunteer_id"}, status=400)

    # ✅ Total assigned tasks
    assigned_tasks = Assignment.objects.filter(volunteer=volunteer)

    total_assigned = assigned_tasks.count()

    # ✅ Completed tasks
    completed_tasks = Task.objects.filter(
        assignment__volunteer=volunteer,
        status="completed"
    ).count()

    # ✅ Active tasks
    active_tasks = Task.objects.filter(
        assignment__volunteer=volunteer,
        status="assigned"
    )

    active_list = []
    for t in active_tasks:
        active_list.append({
            "task_id": t.id,
            "type": t.need_type,
            "location": t.location,
            "urgency": t.urgency,
            "people": t.total_needs
        })

    return Response({
        "name": volunteer.user.name,
        "skills": volunteer.skills,
        "total_assigned": total_assigned,
        "completed_tasks": completed_tasks,
        "active_tasks": active_list
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def volunteer_points_view(request):
    """
    Returns the volunteer's total points and dynamically calculates badges.
    """
    try:
        volunteer = Volunteer.objects.get(user=request.user)
        badges = []

        # 🥇 Points-based badges
        if volunteer.points >= 500:
            badges.append("Elite Responder 🏆")
        elif volunteer.points >= 300:
            badges.append("Community Star 🌟")
        elif volunteer.points >= 100:
            badges.append("Rising Helper ✨")

        # 🛡️ Task-based badges
        if volunteer.tasks_completed >= 20:
            badges.append("Disaster Hero 🚑")
        elif volunteer.tasks_completed >= 10:
            badges.append("Field Expert ⚡")
        elif volunteer.tasks_completed >= 5:
            badges.append("Veteran Responder 🛡️")

        # 🚨 Urgency-based badge (NEW 🔥)
        high_tasks = Assignment.objects.filter(
            volunteer=volunteer,
            task__urgency="HIGH",
            status="completed"
        ).count()

        if high_tasks >= 5:
            badges.append("Crisis Warrior 🔥")
            
        return Response({
            "name": request.user.first_name or request.user.username,
            "total_points": volunteer.points,
            "tasks_completed": volunteer.tasks_completed,
            "badges": badges
        })
        
    except Volunteer.DoesNotExist:
         return Response({"error": "Volunteer profile not found."}, status=404)
    

@api_view(['GET'])
def volunteer_performance(request):
    volunteer_id = request.GET.get("volunteer_id")

    if not volunteer_id:
        return Response({"error": "volunteer_id required"}, status=400)

    try:
        volunteer = Volunteer.objects.get(id=volunteer_id)
    except:
        return Response({"error": "Invalid volunteer_id"}, status=400)

    # 📊 Total completed
    completed = Assignment.objects.filter(
        volunteer=volunteer,
        status="completed"
    )

    total_completed = completed.count()

    # 📊 Urgency breakdown
    high = completed.filter(task__urgency="HIGH").count()
    medium = completed.filter(task__urgency="MEDIUM").count()
    low = completed.filter(task__urgency="LOW").count()

    # 📊 Efficiency (simple)
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