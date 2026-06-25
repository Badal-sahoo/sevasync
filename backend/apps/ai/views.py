from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from apps.users.permissions import IsNGO
from .heatmap.generator import generate_heatmap_data


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsNGO])
def heatmap_api(request):
    if request.user.role != 'NGO':
        return Response(
            {"error": "Unauthorized. Only NGOs can view heatmap data."},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        data = generate_heatmap_data(ngo=request.user)
        return Response(data, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Heatmap API Error: {e}")
        return Response(
            {"error": "Failed to generate heatmap data."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
