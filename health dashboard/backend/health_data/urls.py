from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import api, views_upload

router = DefaultRouter()
router.register(r'step-counts', api.StepCountViewSet, basename='stepcount')
router.register(r'daily-summaries', api.DailySummaryViewSet, basename='dailysummary')

# API endpoints
api_urlpatterns = [
    # File upload
    path('upload/', views_upload.FileUploadView.as_view(), name='file-upload'),
    
    # Stats and summaries
    path('stats/daily/', api.StepCountViewSet.as_view({'get': 'daily_totals'}), name='daily-stats'),
    path('stats/hourly/', api.StepCountViewSet.as_view({'get': 'hourly_totals'}), name='hourly-stats'),
    path('summary/', api.DailySummaryViewSet.as_view({'get': 'summary'}), name='summary-stats'),
]

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
    
    # Include API v1 endpoints
    path('v1/', include(api_urlpatterns)),
]
