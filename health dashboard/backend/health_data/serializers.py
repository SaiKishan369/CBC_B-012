from rest_framework import serializers
from .models import StepCount, DailySummary

class StepCountSerializer(serializers.ModelSerializer):
    class Meta:
        model = StepCount
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class DailySummarySerializer(serializers.ModelSerializer):
    distance_km = serializers.SerializerMethodField()
    
    class Meta:
        model = DailySummary
        fields = [
            'id', 'date', 'step_count', 'distance', 'distance_km', 
            'calories', 'active_time', 'created_at', 'updated_at'
        ]
        read_only_fields = ('created_at', 'updated_at')
    
    def get_distance_km(self, obj):
        # Convert meters to kilometers with 2 decimal places
        return round(obj.distance / 1000, 2)
