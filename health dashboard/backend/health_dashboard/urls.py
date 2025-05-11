"""
URL configuration for health_dashboard project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.response import Response
from rest_framework.documentation import include_docs_urls

urlpatterns = [
    # Admin site
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/', include('health_data.urls')),
    
    # Authentication
    path('api/auth/', include('rest_framework.urls')),
    
    # Health check endpoint
    path('health/', lambda request: Response({'status': 'ok'})),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    
    # Enable browsable API in development
    from rest_framework.schemas import get_schema_view
    from rest_framework.permissions import AllowAny
    
    schema_view = get_schema_view(
        title="Health Dashboard API",
        description="API for health data management and analytics",
        public=True,
        permission_classes=[AllowAny],
    )
    
    urlpatterns += [
        path('api/schema/', schema_view, name='schema'),
        path('api/docs/', include_docs_urls(title='Health Dashboard API')),
    ]
