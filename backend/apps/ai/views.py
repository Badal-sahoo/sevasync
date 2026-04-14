from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.ngo.models import NGOData
from .models import Need
from utils.ai_client import extract_needs_from_text
from .services.heatmap import generate_heatmap_data

@api_view(['POST'])
def extract_needs(request):
    data_id = request.data.get("data_id")
    
    if not data_id:
        return Response({"error": "data_id is required"}, status=400)
        
    try:
        ngo_data = NGOData.objects.get(id=data_id)
    except NGOData.DoesNotExist:
        return Response({"error": "Data record not found"}, status=404)
        
    # Extract structured needs using the AI client
    extracted_data = extract_needs_from_text(ngo_data.raw_text)
    
    if not extracted_data:
        # Fallback: if AI fails, default to a general category as per Edge Cases [cite: 466-473]
        return Response({"error": "Failed to extract needs or raw text unclear"}, status=500)
        
    saved_needs = []
    
    # Save the extracted needs to the database
    for item in extracted_data:
        need = Need.objects.create(
            data=ngo_data,
            type=item.get("type", "general"),
            urgency=item.get("urgency", "medium"),
            location=item.get("location", "")
        )
        
        saved_needs.append({
            "id": need.id,
            "type": need.type,
            "urgency": need.urgency,
            "location": need.location
        })
        
    return Response({
        "needs": saved_needs
    })



@api_view(['GET'])
def heatmap_api(request):
    data = generate_heatmap_data()
    return Response(data)