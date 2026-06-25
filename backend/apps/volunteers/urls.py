from django.urls import path
from .views import (
    create_volunteer,
    volunteer_dashboard,
    volunteer_points_view,
    update_volunteer_profile,
    update_availability,
    get_volunteer_profile,
)

urlpatterns = [
    path('create/', create_volunteer),
    path('dashboard/', volunteer_dashboard),
    path('profile/', get_volunteer_profile),
    path('points/', volunteer_points_view),
    path('me/', update_volunteer_profile),
    path('availability/', update_availability),
]
