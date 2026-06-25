import csv
import io
from .models import Need
from infrastructure.geocoding.nominatim import geocode_location
from apps.ai.extraction.need_detector import detect_need_type
from apps.ai.pipeline.processor import process_needs_into_tasks

_BATCH_SIZE = 100

_VALID_NEED_TYPES = {c[0] for c in Need.NeedType.choices}


def process_csv_upload(file, ngo_id):
    created_count = 0
    skipped_duplicates = 0
    failed_rows = 0
    needs_batch = []
    created_hashes = []

    decoded_file = file.read().decode('utf-8', errors='ignore')
    reader = csv.DictReader(io.StringIO(decoded_file))

    # Load existing hashes once instead of querying per row (was 1 query/row →
    # ~10k queries for a 10k upload). `seen` dedupes rows within this same file.
    existing_hashes = set(
        Need.objects.filter(ngo_id=ngo_id).values_list('row_hash', flat=True)
    )
    seen = set()

    for row in reader:
        name = row.get("name", "").strip()
        problem = row.get("problem", "").strip()
        pincode = row.get("pincode", "").strip()
        location = row.get("location", "").strip()
        need_type = row.get("need_type", "").strip().lower()

        if not problem:
            failed_rows += 1
            continue

        # Honour an explicit need_type column; otherwise infer it from the
        # free-text problem so raw community reports still categorise correctly.
        if need_type not in _VALID_NEED_TYPES:
            need_type = detect_need_type(problem)

        row_hash = Need.compute_hash(name, pincode, problem)
        if row_hash in existing_hashes or row_hash in seen:
            skipped_duplicates += 1
            continue
        seen.add(row_hash)

        try:
            lat, lon = geocode_location(pincode, location)
        except Exception:
            lat, lon = None, None

        needs_batch.append(Need(
            ngo_id=ngo_id,
            name=name,
            problem=problem,
            need_type=need_type,
            location_text=location if location else None,
            latitude=lat,
            longitude=lon,
            row_hash=row_hash,
        ))
        created_hashes.append(row_hash)
        created_count += 1

        if len(needs_batch) >= _BATCH_SIZE:
            Need.objects.bulk_create(needs_batch)
            needs_batch.clear()

    if needs_batch:
        Need.objects.bulk_create(needs_batch)

    if created_hashes:
        new_needs = Need.objects.filter(
            ngo_id=ngo_id, row_hash__in=created_hashes
        ).exclude(latitude=None).exclude(longitude=None)

        if new_needs.exists():
            process_needs_into_tasks(new_needs)

    return {
        "created_count": created_count,
        "skipped_duplicates": skipped_duplicates,
        "failed_rows": failed_rows,
    }
