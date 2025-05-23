# Generated by Django 4.2.7 on 2025-05-10 22:18

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Medicine',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
            ],
        ),
        migrations.CreateModel(
            name='Platform',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('url', models.URLField()),
            ],
        ),
        migrations.CreateModel(
            name='PriceEntry',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('price', models.FloatField()),
                ('last_updated', models.DateTimeField(auto_now=True)),
                ('medicine', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='prices', to='pricecompare.medicine')),
                ('platform', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='prices', to='pricecompare.platform')),
            ],
            options={
                'unique_together': {('medicine', 'platform')},
            },
        ),
    ]
