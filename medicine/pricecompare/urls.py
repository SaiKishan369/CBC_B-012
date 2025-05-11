from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'platforms', views.PlatformViewSet)
router.register(r'medicines', views.MedicineViewSet)
router.register(r'prices', views.PriceEntryViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 