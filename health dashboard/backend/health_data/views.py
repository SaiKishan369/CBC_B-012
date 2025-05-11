from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Sum, Avg
from django.utils import timezone
from datetime import timedelta

from .models import DailySummary

class HealthDashboardView(APIView):
    """
    View to provide aggregated data for the health dashboard
    """
    permission_classes = [AllowAny]
    
    def get(self, request, format=None):
        # Get date range (default to last 30 days)
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=30)
        
        # Get daily summaries for the date range
        daily_summaries = DailySummary.objects.filter(
            date__range=(start_date, end_date)
        ).order_by('date')
        
        # Calculate totals
        total_steps = daily_summaries.aggregate(Sum('step_count'))['step_count__sum'] or 0
        total_distance = daily_summaries.aggregate(Sum('distance'))['distance__sum'] or 0
        total_calories = daily_summaries.aggregate(Sum('calories'))['calories__sum'] or 0
        
        # Calculate daily averages
        avg_steps = daily_summaries.aggregate(Avg('step_count'))['step_count__avg'] or 0
        avg_distance = daily_summaries.aggregate(Avg('distance'))['distance__avg'] or 0
        avg_calories = daily_summaries.aggregate(Avg('calories'))['calories__avg'] or 0
        
        # Get best day
        best_day = daily_summaries.order_by('-step_count').first()
        
        # Prepare chart data
        chart_data = {
            'labels': [summary.date.strftime('%Y-%m-%d') for summary in daily_summaries],
            'steps': [summary.step_count for summary in daily_summaries],
            'distance': [summary.distance / 1000 for summary in daily_summaries],  # Convert to km
            'calories': [summary.calories for summary in daily_summaries],
        }
        
        response_data = {
            'summary': {
                'total_steps': total_steps,
                'total_distance_km': round(total_distance / 1000, 2),  # Convert to km
                'total_calories': round(total_calories, 2),
                'avg_steps': round(avg_steps, 1),
                'avg_distance_km': round(avg_distance / 1000, 2),  # Convert to km
                'avg_calories': round(avg_calories, 1),
                'best_day': {
                    'date': best_day.date.strftime('%Y-%m-%d') if best_day else None,
                    'steps': best_day.step_count if best_day else 0,
                } if best_day else None,
            },
            'chart_data': chart_data,
        }
        
        return Response(response_data)
