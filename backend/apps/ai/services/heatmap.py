from apps.ai.models import Need

def generate_heatmap_data():
    needs = Need.objects.exclude(latitude=None).exclude(longitude=None)

    heatmap = {}

    for need in needs:
        key = (round(need.latitude, 3), round(need.longitude, 3))

        if key not in heatmap:
            heatmap[key] = 0

        weight = 1
        if need.need_type == "medical":
            weight = 3
        elif need.need_type in ["food", "water"]:
            weight = 2

        heatmap[key] += weight

    result = []
    for (lat, lng), intensity in heatmap.items():
        result.append({
            "lat": lat,
            "lng": lng,
            "intensity": intensity
        })

    return result