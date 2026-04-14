from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.tasks.models import Task
from apps.volunteers.models import Volunteer
from .utils import calculate_score


@api_view(['POST'])
def match_volunteers(request):
    task_id = request.data.get("task_id")

    # ✅ Validation
    if not task_id:
        return Response({"error": "task_id required"}, status=400)

    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return Response({"error": "Invalid task_id"}, status=400)

    # ✅ Only available volunteers
    volunteers = Volunteer.objects.filter(availability=True)

    results = []

    for v in volunteers:
        score = calculate_score(task, v)

        results.append({
            "volunteer_id": v.id,
            "name": v.user.name,
            "skills": v.skills,
            "location": v.location,
            "availability": v.availability,
            "score": round(score, 2)
        })

    # ✅ Sort by score
    results.sort(key=lambda x: x["score"], reverse=True)

    # ✅ Structured response
    return Response({
        "task": {
            "task_id": task.id,
            "type": task.need_type,
            "location": task.location,
            "urgency": task.urgency,
            "people": task.total_needs
        },
        "recommended": results[:5],   # top 5
        "best_match": results[0] if results else None,
        "total_candidates": len(results)
    })