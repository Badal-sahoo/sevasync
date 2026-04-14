from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Task, Assignment
from apps.ai.models import Need
from apps.volunteers.models import Volunteer

@api_view(['POST'])
def create_task(request):
    need = Need.objects.get(id=request.data.get('need_id'))

    task = Task.objects.create(
        need=need,
        title=request.data.get('title'),
        location=request.data.get('location'),
        urgency=request.data.get('urgency')
    )

    return Response({"task_id": task.id})


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

    if hasattr(task, 'assignment'):
        return Response({"error": "Task already has request/assignment"}, status=400)

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
            
            # Fetch the volunteer who was assigned this specific task
            assignment = Assignment.objects.get(task=task)
            volunteer = assignment.volunteer
            
            # Update Task
            task.status = "completed"
            task.save()
            
            # Gamification Point Logic
            points_awarded = 0
            if task.urgency.lower() == 'high':
                points_awarded = 50
            elif task.urgency.lower() == 'medium':
                points_awarded = 25
            elif task.urgency.lower() == 'low':
                points_awarded = 10
                
            # Update Volunteer Stats
            volunteer.points += points_awarded
            volunteer.tasks_completed += 1
            volunteer.save()
            
            return Response({
                "message": f"Task completed! Volunteer earned {points_awarded} points.",
                "total_points": volunteer.points,
                "tasks_completed": volunteer.tasks_completed
            })
            
        return Response({"message": "Status updated without point changes."})

    except Task.DoesNotExist:
        return Response({"error": "Task not found."}, status=404)
    except Assignment.DoesNotExist:
        return Response({"error": "Cannot complete task: No volunteer assigned."}, status=400)



@api_view(['POST'])
def respond_task(request):
    task_id = request.data.get("task_id")
    volunteer_id = request.data.get("volunteer_id")
    action = request.data.get("action")

    if not task_id or not volunteer_id or not action:
        return Response({"error": "task_id, volunteer_id, action required"}, status=400)

    assignment = Assignment.objects.filter(
        task_id=task_id,
        volunteer_id=volunteer_id
    ).first()

    if not assignment:
        return Response({"error": "Assignment not found"}, status=400)

    # ❌ prevent invalid
    if assignment.status == "accepted" and action == "reject":
        return Response({"error": "Cannot reject after accepting"}, status=400)

    if action == "accept":
        assignment.status = "accepted"
        assignment.save()

        assignment.task.status = "assigned"
        assignment.task.save()

        return Response({"message": "Task accepted"})

    elif action == "reject":
        assignment.status = "rejected"
        assignment.save()

        # 🔥 Reset task
        assignment.task.status = "pending"
        assignment.task.save()

        return Response({"message": "Task rejected"})

    return Response({"error": "Invalid action"}, status=400)

@api_view(['POST'])
def complete_task(request):
    task_id = request.data.get("task_id")
    volunteer_id = request.data.get("volunteer_id")

    if not task_id or not volunteer_id:
        return Response({"error": "task_id and volunteer_id required"}, status=400)

    # 🔍 Find assignment
    assignment = Assignment.objects.filter(
        task_id=task_id,
        volunteer_id=volunteer_id
    ).first()

    if not assignment:
        return Response({"error": "Assignment not found"}, status=400)

    # ❌ Prevent invalid flow
    if assignment.status != "accepted":
        return Response({"error": "Task must be accepted first"}, status=400)

    # ✅ Mark completed
    assignment.status = "completed"
    assignment.save()

    task = assignment.task
    task.status = "completed"
    task.save()

    # 🎯 POINT SYSTEM (basic)
    points = 0

    if task.urgency == "HIGH":
        points = 50
    elif task.urgency == "MEDIUM":
        points = 30
    else:
        points = 10

    return Response({
        "message": "Task completed",
        "points_earned": points
    })


@api_view(['GET'])
def get_task_detail(request, task_id):
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return Response({"error": "Task not found"}, status=404)

    # Check assignment
    assignment = Assignment.objects.filter(task=task).select_related('volunteer').first()

    if assignment:
        volunteer_data = {
            "id": assignment.volunteer.id,
            "name": getattr(assignment.volunteer, "name", ""),
            "skills": getattr(assignment.volunteer, "skills", "")
        }
        assigned = True
    else:
        volunteer_data = None
        assigned = False

    return Response({
        "task_id": task.id,
        "need_type": task.need_type,
        "location": task.location,
        "urgency": task.urgency,
        "total_needs": task.total_needs,
        "status": task.status,
        "assigned": assigned,
        "volunteer": volunteer_data
    })