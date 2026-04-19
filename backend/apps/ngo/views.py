import os
import uuid
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from utils.csv_processor import process_csv_file
from apps.ai.models import Need
from apps.tasks.models import Task,Assignment 
from apps.volunteers.models import Volunteer
from utils.auth import get_current_user

@api_view(['POST'])
def upload_csv(request):
    try:
        if not request.user or not request.user.is_authenticated:
            return Response({"error": "Authentication required"}, status=401)

        file = request.FILES.get('file')

        if not file:
            return Response({"error": "CSV file required"}, status=400)

        user = request.user

        # 🔥 DIRECTLY PROCESS FILE (NO SAVING)
        processed_count = process_csv_file(file, user.id)

        return Response({
            "message": f"Successfully mapped {processed_count} needs.",
            "status": "success"
        })

    except Exception as e:
        print("🔥 UPLOAD ERROR:", str(e))
        return Response({"error": str(e)}, status=500)
    


@api_view(['GET'])
def ngo_dashboard(request):
    try:
        user = request.user

        total_requests = Need.objects.filter(ngo=user).count()

        total_tasks = Task.objects.filter(ngo=user).count()

        completed_tasks = Task.objects.filter(
            ngo=user,
            status="completed"
        ).count()

        urgent_tasks = Task.objects.filter(
            ngo=user,
            urgency="HIGH"
        ).count()

        active_volunteers = Volunteer.objects.filter(
            availability=True
        ).count()

        return Response({
            "total_requests": total_requests or 0,
            "total_tasks": total_tasks or 0,
            "completed_tasks": completed_tasks or 0,
            "active_volunteers": active_volunteers or 0,
            "urgent_tasks": urgent_tasks or 0
        })

    except Exception as e:
        print("🔥 NGO DASHBOARD ERROR:", str(e))   # 👈 VERY IMPORTANT
        return Response({
            "total_requests": 0,
            "total_tasks": 0,
            "completed_tasks": 0,
            "active_volunteers": 0,
            "urgent_tasks": 0
        })

@api_view(['GET'])
def ngo_requests(request):

    user = get_current_user(request)

    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    urgency = request.GET.get("urgency")

    tasks = Task.objects.filter(ngo_id=user.id)

    # ✅ FIX: handle urgency properly
    if urgency:
        if urgency in ["HIGH", "MEDIUM", "LOW"]:
            tasks = tasks.filter(urgency=urgency)
        else:
            return Response({"error": "Invalid urgency value"}, status=400)

    data = []
    for t in tasks:
        assignment = Assignment.objects.filter(task=t).first()

        volunteer_data = None
        if assignment:
            v = assignment.volunteer
            volunteer_data = {
                "volunteer_id": v.id,
                "name": v.user.name,
                "skills": v.skills
            }

        data.append({
            "id": t.id,
            "type": t.need_type,
            "location": t.location,
            "location_name": t.location_name,
            "urgency": t.urgency,
            "total_people": t.total_needs,
            "status": t.status,
            "assigned_volunteer": volunteer_data
        })

    return Response(data) 



@api_view(['GET'])
def ngo_volunteers(request):
    volunteers = Volunteer.objects.all()

    data = []
    for v in volunteers:
        data.append({
            "volunteer_id": v.id,
            "name": v.user.name,
            "skills": v.skills,
            "location": v.location,
            "availability": v.availability
        })

    return Response(data)
