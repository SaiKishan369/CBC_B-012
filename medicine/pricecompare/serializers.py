from rest_framework import serializers
from .models import Platform, Medicine, PriceEntry

class PlatformSerializer(serializers.ModelSerializer):
    class Meta:
        model = Platform
        fields = ['id', 'name', 'url']

class MedicineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicine
        fields = ['id', 'name']

class PriceEntrySerializer(serializers.ModelSerializer):
    platform = PlatformSerializer(read_only=True)
    
    class Meta:
        model = PriceEntry
        fields = ['platform', 'price', 'last_updated']

class MedicinePriceSerializer(serializers.ModelSerializer):
    prices = PriceEntrySerializer(many=True, read_only=True)
    
    class Meta:
        model = Medicine
        fields = ['id', 'name', 'prices'] 