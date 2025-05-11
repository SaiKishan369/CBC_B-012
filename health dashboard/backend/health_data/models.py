from django.db import models
from django.utils import timezone

class StepCount(models.Model):
    date = models.DateField()
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    count = models.IntegerField()
    distance = models.FloatField(help_text="Distance in meters")
    calories = models.FloatField()
    speed = models.FloatField(help_text="Speed in m/s")
    device_uuid = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-start_time']
        verbose_name = 'Step Count'
        verbose_name_plural = 'Step Counts'

    def __str__(self):
        return f"{self.date}: {self.count} steps"

class DailySummary(models.Model):
    date = models.DateField(unique=True)
    step_count = models.IntegerField()
    distance = models.FloatField(help_text="Distance in meters")
    calories = models.FloatField()
    active_time = models.IntegerField(help_text="Active time in seconds")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']
        verbose_name_plural = 'Daily Summaries'

    def __str__(self):
        return f"{self.date}: {self.step_count} steps, {self.distance/1000:.2f} km"
