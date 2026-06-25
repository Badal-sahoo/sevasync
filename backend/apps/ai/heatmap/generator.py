from apps.tasks.models import Task

# Frontend legend: intensity >= 3 → High, == 2 → Medium, == 1 → Low.
_URGENCY_INTENSITY = {"HIGH": 3, "MEDIUM": 2, "LOW": 1}


def generate_heatmap_data(ngo):
    """Heatmap of OUTSTANDING tasks, weighted by urgency.

    Built from active tasks (not raw needs) so that completing/cancelling a task
    immediately removes it from the map, and the intensity reflects each task's
    urgency rather than a fixed per-type weight.
    """
    tasks = (
        Task.objects.filter(ngo=ngo)
        .exclude(status__in=("completed", "cancelled"))
        .exclude(latitude=None)
        .exclude(longitude=None)
    )

    return [
        {
            "lat": float(t.latitude),
            "lng": float(t.longitude),
            "intensity": _URGENCY_INTENSITY.get(t.urgency, 1),
            "type": t.need_type,
            "people": t.people_count,
        }
        for t in tasks
    ]
