from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.tasks.models import Task
from apps.volunteers.models import Volunteer
from .utils import calculate_score
from apps.tasks.models import Assignment
from .utils import get_matched_volunteers

@api_view(['POST'])
def match_volunteers(request):
    task_id = request.data.get("task_id")

    if not task_id:
        return Response({"error": "task_id required"}, status=400)

    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return Response({"error": "Invalid task_id"}, status=400)

    results = get_matched_volunteers(task)

    return Response({
        "task": {
            "task_id": task.id,
            "type": task.need_type,
            "location": task.location,
            "urgency": task.urgency,
            "people": task.total_needs
        },
        "recommended": results[:5],
        "best_match": results[0] if results else None,
        "total_candidates": len(results)
    })