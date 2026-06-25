"""
CSV upload processing pipeline.

Flow: needs_queryset → DBSCAN clustering → severity scoring → bulk Task create/update.
"""

from collections import defaultdict
import traceback

from apps.tasks.models import Task
from apps.ai.clustering.dbscan import cluster_needs_geographically
from apps.ai.severity.scorer import severity_for


def process_needs_into_tasks(needs_queryset):
    needs = list(needs_queryset)

    if not needs:
        return

    ngo = needs[0].ngo

    # Only consider pending tasks that have no accepted assignment — skip locked tasks.
    existing_tasks = Task.objects.filter(ngo=ngo, status="pending").exclude(
        assignments__status="accepted"
    )

    existing_tasks_by_key = {
        (t.need_type, round(t.latitude or 0, 2), round(t.longitude or 0, 2)): t
        for t in existing_tasks
        if t.latitude is not None
    }

    tasks_to_create = []
    tasks_to_update = set()
    # Track (task_obj, [need_ids]) so we can set source_needs after bulk_create.
    new_task_needs: list[tuple] = []

    clusters = cluster_needs_geographically(needs)

    for cluster_id, cluster in clusters.items():
        if cluster_id == -1:
            for need in cluster:
                _stage_isolated_need(need, existing_tasks_by_key, tasks_to_create, tasks_to_update, new_task_needs)
            continue

        grouped = defaultdict(list)
        for need in cluster:
            grouped[need.need_type].append(need)

        avg_lat = sum(n.latitude for n in cluster) / len(cluster)
        avg_lon = sum(n.longitude for n in cluster) / len(cluster)

        location_names = [n.location_text for n in cluster if n.location_text]
        location_name = (
            max(set(location_names), key=location_names.count)
            if location_names else "Unknown"
        )

        for need_type, needs_list in grouped.items():
            total = len(needs_list)
            lookup_key = (need_type, round(avg_lat, 2), round(avg_lon, 2))
            description = " | ".join(n.problem for n in needs_list if n.problem)

            if lookup_key in existing_tasks_by_key:
                existing_task = existing_tasks_by_key[lookup_key]
                existing_task.people_count += total
                # Recompute urgency from the (now larger) people count.
                existing_task.urgency = severity_for(existing_task.need_type, existing_task.people_count)
                if not existing_task.description:
                    existing_task.description = description
                tasks_to_update.add(existing_task)
            else:
                new_task = Task(
                    ngo=ngo,
                    need_type=need_type,
                    latitude=avg_lat,
                    longitude=avg_lon,
                    location_name=location_name,
                    urgency=severity_for(need_type, total),
                    people_count=total,
                    description=description,
                    status="pending",
                )
                existing_tasks_by_key[lookup_key] = new_task
                tasks_to_create.append(new_task)
                new_task_needs.append((new_task, [n.id for n in needs_list]))

    try:
        if tasks_to_create:
            Task.objects.bulk_create(tasks_to_create)
            # Set source_needs on newly created tasks (PKs are available after bulk_create on PostgreSQL).
            for task_obj, need_ids in new_task_needs:
                if task_obj.pk:
                    task_obj.source_needs.set(need_ids)
        if tasks_to_update:
            Task.objects.bulk_update(list(tasks_to_update), ['people_count', 'urgency', 'description'])
    except Exception as e:
        print("TASK BATCH ERROR:", e)
        traceback.print_exc()


def _stage_isolated_need(need, existing_tasks_by_key, tasks_to_create, tasks_to_update, new_task_needs):
    lookup_key = (need.need_type, round(need.latitude, 2), round(need.longitude, 2))

    if lookup_key in existing_tasks_by_key:
        existing_task = existing_tasks_by_key[lookup_key]
        existing_task.people_count += 1
        existing_task.urgency = severity_for(existing_task.need_type, existing_task.people_count)
        tasks_to_update.add(existing_task)
    else:
        new_task = Task(
            ngo=need.ngo,
            need_type=need.need_type,
            latitude=need.latitude,
            longitude=need.longitude,
            location_name=need.location_text or "Unknown",
            urgency=severity_for(need.need_type, 1),
            people_count=1,
            description=need.problem or '',
            status="pending",
        )
        existing_tasks_by_key[lookup_key] = new_task
        tasks_to_create.append(new_task)
        new_task_needs.append((new_task, [need.id]))
