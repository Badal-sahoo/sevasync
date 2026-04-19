"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path
from apps.users.views import signup, login
from apps.ngo.views import upload_csv,ngo_dashboard,ngo_requests,ngo_volunteers
from apps.ai.views import extract_needs,heatmap_api
from apps.volunteers.views import create_volunteer,volunteer_dashboard,volunteer_points_view ,volunteer_performance,update_volunteer_profile, update_availability,get_volunteer_profile
from apps.tasks.views import create_task, assign_task, update_status,respond_task,get_task_detail,add_update,get_updates,update_taskstatus
from apps.matching.views import match_volunteers
urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/auth/signup/', signup),
    path('api/auth/login/', login),

    path('api/upload/', upload_csv),
    path('api/extract/', extract_needs),
    path('api/ngo/dashboard/', ngo_dashboard),
    path('api/ngo/requests/', ngo_requests),
    path('api/ngo/volunteers/', ngo_volunteers),
    path('api/task/<int:task_id>/', get_task_detail),

    path('api/heatmap/', heatmap_api),

    
    path('api/volunteer/dashboard/', volunteer_dashboard),
    path('api/task/respond/', respond_task),
    path('api/volunteer/points/', volunteer_points_view, name='volunteer-points'),
    path('api/volunteer/performance/', volunteer_performance),
    path('api/volunteer/update/', update_volunteer_profile),
    path('api/volunteer/availability/', update_availability),
    path('api/volunteer/profile/', get_volunteer_profile),
    path('api/volunteer/create/', create_volunteer),
    path('api/volunteer/addUpdate/', add_update),
    path('api/volunteer/getUpdate/', get_updates),
    path('api/task/update-status/', update_taskstatus),

    path('api/task/create/', create_task),
    path('api/task/assign/', assign_task),
    path('api/task/update/', update_status),

    path('api/match/', match_volunteers),
]
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)