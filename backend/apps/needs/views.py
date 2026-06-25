from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.users.permissions import IsNGO
from .services import process_csv_upload
from .serializers import ManualNeedCreateSerializer
from .models import Need
from infrastructure.geocoding.nominatim import geocode_location


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsNGO])
def create_need(request):
    serializer = ManualNeedCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    data = serializer.validated_data
    pincode = data.get('pincode', '')
    location = data.get('location', '')

    lat, lon = geocode_location(pincode, location)

    need = Need.objects.create(
        ngo=request.user,
        name=data['name'],
        problem=data['problem'],
        need_type=data['need_type'],
        location_text=location or None,
        latitude=lat,
        longitude=lon,
    )

    return Response({"id": need.id, "message": "Need created"}, status=201)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsNGO])
def upload_csv(request):

    file = request.FILES.get('file')
    if not file:
        return Response({"error": "CSV file required"}, status=400)

    try:
        result = process_csv_upload(file, request.user.id)
        return Response({
            "message": f"Created {result['created_count']} needs.",
            "created_count": result["created_count"],
            "skipped_duplicates": result["skipped_duplicates"],
            "failed_rows": result["failed_rows"],
        })
    except Exception as e:
        print("UPLOAD ERROR:", str(e))
        return Response({"error": str(e)}, status=500)
