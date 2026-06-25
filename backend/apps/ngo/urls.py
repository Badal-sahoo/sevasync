from django.urls import path
from .views import ngo_dashboard, ngo_requests
from apps.needs.views import upload_csv
from apps.ai.views import heatmap_api

urlpatterns = [
    path('upload/', upload_csv),
    path('dashboard/', ngo_dashboard),
    path('requests/', ngo_requests),
    path('heatmap/', heatmap_api),
]
