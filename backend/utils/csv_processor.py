import csv
import os
from apps.ai.models import Need
from utils.problem_mapper import extract_need_types
from utils.location import get_lat_long
from apps.ai.services.pipeline import run_pipeline_bulk

def process_csv_file(file_path, ngo_id):
    processed_count = 0
    
    try:
        with open(file_path, 'r') as f:
            reader = list(csv.DictReader(f))
            batch = []
            BATCH_SIZE = 100

            for row in reader:
                name = row.get("name", "").strip()
                problem = row.get("problem", "").strip()
                pincode = row.get("pincode", "").strip()
                location = row.get("location", "").strip()

                if not problem:
                    continue

                need_types = extract_need_types(problem)
                lat, lon = get_lat_long(pincode, location)

                for need_type in need_types:
                    batch.append(
                        Need(
                            ngo_id=ngo_id,
                            name=name,
                            problem=problem,
                            need_type=need_type,
                            pincode=pincode if pincode else None,
                            location_text=location if location else None,
                            latitude=lat,
                            longitude=lon
                        )
                    )
                    processed_count += 1

                if len(batch) >= BATCH_SIZE:
                    Need.objects.bulk_create(batch)
                    batch.clear()

            if batch:
                Need.objects.bulk_create(batch)

        # 🔥 RUN PIPELINE ONLY ONCE
        all_needs = Need.objects.exclude(latitude=None).exclude(longitude=None)
        run_pipeline_bulk(all_needs)

    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

    return processed_count