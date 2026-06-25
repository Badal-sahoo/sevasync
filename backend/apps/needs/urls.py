from django.urls import path
from .views import upload_csv, create_need

urlpatterns = [
    path('', create_need),
    path('upload/', upload_csv),
]
