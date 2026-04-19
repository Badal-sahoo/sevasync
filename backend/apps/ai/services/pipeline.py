from collections import defaultdict
from apps.tasks.models import Task
from .clustering import run_dbscan
from .feature_builder import extract_features
from .severity_engine import calculate_base_severity
from .gemini_refiner import refine_severities_bulk
import traceback

def run_pipeline_bulk(needs_queryset):
    needs = list(needs_queryset)

    if not needs:
        return

    # Extract the NGO once safely at the top
    current_ngo = needs[0].ngo

    # 🔹 PRE-FETCH: Get all pending tasks for this NGO in ONE query
    existing_tasks = Task.objects.filter(ngo=current_ngo, status="pending")
    
    # 🔹 IN-MEMORY LOOKUP: Dictionary keyed by (need_type, location)
    task_lookup = {(t.need_type, t.location): t for t in existing_tasks}
    
    tasks_to_create = []
    tasks_to_update = set() # Using a set to prevent duplicate updates

    # 🔹 STEP 1: Run DBSCAN clustering (Now using Haversine math)
    clusters = run_dbscan(needs)

    # ==========================================
    # 🔹 PASS 1: Prep data for Gemini Batch API
    # ==========================================
    gemini_payload = {}
    cluster_features = {}
    
    for cluster_id, cluster in clusters.items():
        if cluster_id == -1:
            continue # Skip noise for the AI payload
            
        features = extract_features(cluster)
        base_severity = calculate_base_severity(features)
        
        # Save features so we don't recalculate in Pass 2
        cluster_features[cluster_id] = features 
        
        gemini_payload[str(cluster_id)] = {
            **features,
            "base_severity": base_severity
        }

    # 🔹 THE SINGLE AI CALL: Evaluate all clusters at once
    refined_severities = refine_severities_bulk(gemini_payload)

    # ==========================================
    # 🔹 PASS 2: Stage Tasks in Memory
    # ==========================================
    for cluster_id, cluster in clusters.items():
        
        # Handle noise (isolated points)
        if cluster_id == -1:
            for need in cluster:
                process_single_need_in_memory(need, task_lookup, tasks_to_create, tasks_to_update)
            continue

        # Get AI severity, falling back to our base logic if the API failed or skipped it
        final_severity = refined_severities.get(
            str(cluster_id), 
            calculate_base_severity(cluster_features[cluster_id])
        )

        # Group by need_type
        grouped = defaultdict(list)
        for need in cluster:
            grouped[need.need_type].append(need)

        # Compute cluster center
        avg_lat = sum(n.latitude for n in cluster) / len(cluster)
        avg_lon = sum(n.longitude for n in cluster) / len(cluster)
        location_key = f"{round(avg_lat, 2)},{round(avg_lon, 2)}"
        location_names = [n.location_text for n in cluster if n.location_text]

        location_name = (
            max(set(location_names), key=location_names.count)
            if location_names else "Unknown"
        )
        # Stage Create / Update tasks IN MEMORY
        for need_type, needs_list in grouped.items():
            total = len(needs_list)
            lookup_key = (need_type, location_key)

            if lookup_key in task_lookup:
                # Stage existing task for update
                existing_task = task_lookup[lookup_key]
                existing_task.total_needs += total
                
                # Upgrade severity if the AI flagged it as HIGH
                if final_severity == "HIGH":
                    existing_task.urgency = "HIGH"
                
                tasks_to_update.add(existing_task)
            else:
                # Stage new task for creation
                new_task = Task(
                    ngo=current_ngo,
                    need_type=need_type,
                    location=location_key,
                    location_name=location_name,
                    urgency=final_severity,
                    total_needs=total,
                    status="pending"
                )
                task_lookup[lookup_key] = new_task 
                tasks_to_create.append(new_task)

    # ==========================================
    # 🔹 FINAL STEP: BULK DATABASE FLUSH
    # ==========================================
    try:
        if tasks_to_create:
            Task.objects.bulk_create(tasks_to_create)
        
        if tasks_to_update:
            Task.objects.bulk_update(list(tasks_to_update), ['total_needs', 'urgency'])
            
    except Exception as e:
        print("🔥 TASK BATCH ERROR:", e)
        traceback.print_exc()


# 🔹 Helper function for isolated points
def process_single_need_in_memory(need, task_lookup, tasks_to_create, tasks_to_update):
    location_key = f"{round(need.latitude, 2)},{round(need.longitude, 2)}"
    lookup_key = (need.need_type, location_key)

    if lookup_key in task_lookup:
        existing_task = task_lookup[lookup_key]
        existing_task.total_needs += 1
        tasks_to_update.add(existing_task)
    else:
        new_task = Task(
            ngo=need.ngo,
            need_type=need.need_type,
            location=location_key,
            location_name = need.location_text or "Unknown",
            urgency="LOW",
            total_needs=1,
            status="pending"
        )
        task_lookup[lookup_key] = new_task
        tasks_to_create.append(new_task)