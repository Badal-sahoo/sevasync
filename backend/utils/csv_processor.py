import csv
import os
from apps.ai.models import Need
from utils.problem_mapper import extract_need_types
from utils.location import get_lat_long
from apps.ai.services.pipeline import run_pipeline_bulk
import io
def process_csv_file(file, ngo_id):
    processed_count = 0
    batch = []
    BATCH_SIZE = 100

    try:
        # 🔥 Convert file to readable stream
        decoded_file = file.read().decode('utf-8')
        reader = csv.DictReader(io.StringIO(decoded_file))

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

        # 🔥 RUN PIPELINE ONCE
        all_needs = Need.objects.filter(ngo_id=ngo_id)\
            .exclude(latitude=None).exclude(longitude=None)

        run_pipeline_bulk(all_needs)

    except Exception as e:
        print("🔥 CSV PROCESS ERROR:", str(e))
        raise e

    return processed_count
