from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/ngo/', include('apps.ngo.urls')),
    path('api/tasks/', include('apps.tasks.urls')),
    path('api/volunteers/', include('apps.volunteers.urls')),
    path('api/needs/', include('apps.needs.urls')),
]
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
