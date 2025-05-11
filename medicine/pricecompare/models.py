from django.db import models

# Create your models here.

class Platform(models.Model):
    name = models.CharField(max_length=100)
    url = models.URLField()

    def __str__(self):
        return self.name

class Medicine(models.Model):
    name = models.CharField(max_length=200)

    def __str__(self):
        return self.name

class PriceEntry(models.Model):
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE, related_name='prices')
    platform = models.ForeignKey(Platform, on_delete=models.CASCADE, related_name='prices')
    price = models.FloatField()
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('medicine', 'platform')

    def __str__(self):
        return f"{self.medicine.name} - {self.platform.name}: {self.price}"
