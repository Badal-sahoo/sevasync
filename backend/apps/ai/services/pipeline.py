from collections import defaultdict
from apps.tasks.models import Task
from .clustering import run_dbscan
from .feature_builder import extract_features
from .severity_engine import calculate_base_severity
import traceback
def run_pipeline_bulk(needs_queryset):

    needs = list(needs_queryset)

    if not needs:
        return

    # 🔹 STEP 1: Run DBSCAN clustering
    clusters = run_dbscan(needs)

    for cluster_id, cluster in clusters.items():

        # 🔹 Handle noise (isolated points)
        if cluster_id == -1:
            for need in cluster:
                process_single_need(need)
            continue

        # 🔹 STEP 2: Extract cluster features
        features = extract_features(cluster)
        base_severity = calculate_base_severity(features)

        # 🔹 STEP 3: Group by need_type
        grouped = defaultdict(list)
        for need in cluster:
            grouped[need.need_type].append(need)

        # 🔹 STEP 4: Compute cluster center (for location key)
        avg_lat = sum(n.latitude for n in cluster) / len(cluster)
        avg_lon = sum(n.longitude for n in cluster) / len(cluster)

        location_key = f"{round(avg_lat, 2)},{round(avg_lon, 2)}"

        # 🔹 STEP 5: Create / Update tasks
        for need_type, needs_list in grouped.items():

            total = len(needs_list)
            ngo = cluster[0].ngo
            # 🔍 Check existing task (DEDUP)
            existing_task = Task.objects.filter(
                ngo=need.ngo,
                need_type=need_type,
                location=location_key,
                status="pending"
            ).first()

            if existing_task:
                # ✅ Update existing task
                existing_task.total_needs += total

                # Upgrade urgency if needed
                if base_severity == "HIGH":
                    existing_task.urgency = "HIGH"

                existing_task.save()

            else:
                try:
                # ✅ Create new task
                    ngo = cluster[0].ngo
                    if not ngo:
                        print("❌ NGO missing in cluster")
                        return
                    Task.objects.create(
                        ngo=need.ngo,
                        need_type=need_type,
                        location=location_key,
                        urgency=base_severity,
                        total_needs=total
                    )
                except Exception as e:
                    print("🔥 TASK CREATE ERROR:", e)
                    traceback.print_exc()


# 🔹 Handle isolated points (no cluster)
def process_single_need(need):

    location_key = f"{round(need.latitude, 2)},{round(need.longitude, 2)}"

    existing_task = Task.objects.filter(
        ngo=need.ngo,
        need_type=need.need_type,
        location=location_key,
        status="pending"
    ).first()

    if existing_task:
        existing_task.total_needs += 1
        existing_task.save()

    else:
        Task.objects.create(
            ngo=need.ngo,
            need_type=need.need_type,
            location=location_key,
            urgency="LOW",
            total_needs=1
        )