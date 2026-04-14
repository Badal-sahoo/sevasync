import os
import uuid
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from utils.csv_processor import process_csv_file
from apps.ai.models import Need
from apps.tasks.models import Task,Assignment 
from apps.volunteers.models import Volunteer


@api_view(['POST'])
def upload_csv(request):
    if 'file' not in request.FILES:
        return Response({"error": "CSV file required"}, status=400)

    ngo_id = request.data.get("ngo_id")
    if not ngo_id:
        return Response({"error": "ngo_id required"}, status=400)

    file = request.FILES['file']

    # Generate a unique filename so rapid testing doesn't cause collisions
    _, ext = os.path.splitext(file.name)
    safe_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(settings.MEDIA_ROOT, safe_filename)

    with open(file_path, 'wb+') as destination:
        for chunk in file.chunks():
            destination.write(chunk)

    # 🛑 SYNCHRONOUS CALL: The frontend will wait for this to finish
    try:
        processed_count = process_csv_file(file_path, ngo_id)
        return Response({
            "message": f"Successfully mapped {processed_count} needs.",
            "status": "success"
        })
    except Exception as e:
        # Catch any wild errors so the server doesn't crash during the demo
        return Response({"error": str(e)}, status=500)
    


@api_view(['GET'])
def ngo_dashboard(request):
    ngo_id = request.GET.get("ngo_id")

    if not ngo_id:
        return Response({"error": "ngo_id required"}, status=400)

    total_requests = Need.objects.filter(ngo_id=ngo_id).count()

    total_tasks = Task.objects.filter(ngo_id=ngo_id).count()

    completed_tasks = Task.objects.filter(
        ngo_id=ngo_id,
        status="completed"
    ).count()

    active_volunteers = Volunteer.objects.filter(
        availability=True
    ).count()

    urgent_tasks = Task.objects.filter(
        ngo_id=ngo_id,
        urgency="HIGH"
    ).count()

    return Response({
        "total_requests": total_requests,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "active_volunteers": active_volunteers,
        "urgent_tasks": urgent_tasks
    })

@api_view(['GET'])
def ngo_requests(request):
    ngo_id = request.GET.get("ngo_id")
    urgency = request.GET.get("urgency")

    if not ngo_id:
        return Response({"error": "ngo_id required"}, status=400)

    tasks = Task.objects.filter(ngo_id=ngo_id)

    if urgency:
        tasks = tasks.filter(urgency=urgency.upper())

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