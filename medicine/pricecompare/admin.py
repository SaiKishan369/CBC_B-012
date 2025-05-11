from django.contrib import admin
from .models import Platform, Medicine, PriceEntry

admin.site.register(Platform)
admin.site.register(Medicine)
admin.site.register(PriceEntry)
