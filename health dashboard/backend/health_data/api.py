from rest_framework import serializers, viewsets, generics
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Sum, F, DateField, DateTimeField
from django.db.models.functions import TruncDate, TruncHour
from .models import StepCount, DailySummary

class StepCountSerializer(serializers.ModelSerializer):
    class Meta:
        model = StepCount
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

class DailySummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = DailySummary
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

class StepCountViewSet(viewsets.ModelViewSet):
    queryset = StepCount.objects.all()
    serializer_class = StepCountSerializer
    
    @action(detail=False, methods=['get'])
    def daily_totals(self, request):
        # Get daily step totals
        daily_totals = StepCount.objects.values('date').annotate(
            total_steps=Sum('count'),
            total_distance=Sum('distance'),
            total_calories=Sum('calories')
        ).order_by('date')
        
        return Response({
            'results': list(daily_totals)
        })
    
    @action(detail=False, methods=['get'])
    def hourly_totals(self, request):
        # Get hourly step totals for the specified date (default to today)
        date_param = request.query_params.get('date', None)
        queryset = StepCount.objects.all()
        
        if date_param:
            queryset = queryset.filter(date=date_param)
        
        hourly_totals = queryset.annotate(
            hour=TruncHour('start_time', output_field=DateTimeField())
        ).values('hour').annotate(
            total_steps=Sum('count'),
            avg_speed=Sum(F('speed') * F('count')) / Sum('count'),
            total_distance=Sum('distance'),
            total_calories=Sum('calories')
        ).order_by('hour')
        
        return Response({
            'results': list(hourly_totals)
        })

class DailySummaryViewSet(viewsets.ModelViewSet):
    queryset = DailySummary.objects.all()
    serializer_class = DailySummarySerializer
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        # Get summary statistics
        total_steps = DailySummary.objects.aggregate(total=Sum('step_count'))['total'] or 0
        total_distance = DailySummary.objects.aggregate(total=Sum('distance'))['total'] or 0
        total_calories = DailySummary.objects.aggregate(total=Sum('calories'))['total'] or 0
        total_active_time = DailySummary.objects.aggregate(total=Sum('active_time'))['total'] or 0
        
        # Convert active time from seconds to hours and minutes
        hours = total_active_time // 3600
        minutes = (total_active_time % 3600) // 60
        
        return Response({
            'total_steps': total_steps,
            'total_distance': total_distance,
            'total_calories': total_calories,
            'total_active_time': f"{hours}h {minutes}m",
            'daily_average_steps': total_steps / DailySummary.objects.count() if DailySummary.objects.exists() else 0
        })
