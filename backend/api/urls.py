from django.urls import path
from .views import MentalHealthManagementView, WellbeingRoadmapView

urlpatterns = [
    path('mental-health-support/', MentalHealthManagementView.as_view(), name='mental-health-support'),
    path('wellbeing/roadmap/', WellbeingRoadmapView.as_view(), name='wellbeing-roadmap'),
] 