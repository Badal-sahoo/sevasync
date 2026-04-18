from apps.ai.models import Need

def generate_heatmap_data(ngo):
    # 🔹 Filter by the specific NGO to prevent data leakage
    needs = Need.objects.filter(ngo=ngo).exclude(latitude=None).exclude(longitude=None)

    result = []

    for need in needs:
        # Determine the weight/intensity of the need
        weight = 1
        if need.need_type == "medical":
            weight = 3
        elif need.need_type in ["food", "water"]:
            weight = 2

        # 🔹 Pass exact coordinates to the frontend instead of grouping on the backend.
        # This allows your React dashboard to render a fluid, high-resolution heatmap.
        result.append({
            "lat": float(need.latitude),
            "lng": float(need.longitude),
            "intensity": weight
        })

    return result