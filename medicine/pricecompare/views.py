from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Platform, Medicine, PriceEntry
from .serializers import (
    PlatformSerializer,
    MedicineSerializer,
    PriceEntrySerializer,
    MedicinePriceSerializer
)
from .utils import scrape_1mg_price

# Create your views here.

class PlatformViewSet(viewsets.ModelViewSet):
    queryset = Platform.objects.all()
    serializer_class = PlatformSerializer

class MedicineViewSet(viewsets.ModelViewSet):
    queryset = Medicine.objects.all()
    serializer_class = MedicineSerializer

    @action(detail=False, methods=['get'])
    def search(self, request):
        medicine_name = request.query_params.get('medicine', '')
        if not medicine_name:
            return Response(
                {'error': 'Please provide a medicine name'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Try to fetch from DB as before
        try:
            medicine = get_object_or_404(Medicine, name__icontains=medicine_name)
            db_data = MedicinePriceSerializer(medicine).data
        except Exception:
            db_data = None

        # Live scrape from 1mg only
        scraped_price = scrape_1mg_price(medicine_name)
        scraped_result = {
            'platform': {'name': '1mg'},
            'price': scraped_price,
            'last_updated': None
        } if scraped_price is not None else None

        # Compose response
        response = {
            'db_data': db_data,
            'scraped_prices': [scraped_result] if scraped_result else []
        }
        return Response(response)

class PriceEntryViewSet(viewsets.ModelViewSet):
    queryset = PriceEntry.objects.all()
    serializer_class = PriceEntrySerializer
