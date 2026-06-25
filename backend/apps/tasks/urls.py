from django.urls import path
from .views import (
    assign_task, respond_task, get_task_detail, task_progress,
    complete_task, cancel_task, cancel_request, withdraw_assignment,
)

urlpatterns = [
    path('<int:task_id>/', get_task_detail),
    path('<int:task_id>/assign/', assign_task),
    path('<int:task_id>/respond/', respond_task),
    path('<int:task_id>/complete/', complete_task),
    path('<int:task_id>/cancel/', cancel_task),
    path('<int:task_id>/cancel-request/', cancel_request),
    path('<int:task_id>/progress/', task_progress),
    path('assignments/<int:assignment_id>/withdraw/', withdraw_assignment),
]
