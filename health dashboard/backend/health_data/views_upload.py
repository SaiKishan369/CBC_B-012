import os
import zipfile
import json
import pandas as pd
from datetime import datetime, time
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.db import transaction, IntegrityError
from django.core.exceptions import ValidationError
from django.utils import timezone
from .models import StepCount, DailySummary
from .utils import validate_file, process_health_data, save_uploaded_file

# Constants for data processing
DEFAULT_DEVICE_UUID = 'samsung_health_import'

class FileUploadView(APIView):
    """
    API endpoint for uploading and processing health data files.
    Supports JSON, CSV, Excel, and ZIP archives containing health data.
    """
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        """Handle file upload and processing."""
        if 'file' not in request.FILES:
            return Response(
                {'error': 'No file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        file = request.FILES['file']
        
        try:
            # Validate file
            try:
                validate_file(file)
            except ValidationError as e:
                return Response(
                    {'error': str(e)}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Process the file
            try:
                # Save the file temporarily
                file_path = save_uploaded_file(file)
                
                # Process the file based on its type
                processed_data = process_health_data(file)
                
                # Save the processed data to database
                result = self._save_health_data(processed_data, request.user)
                
                # Clean up the temporary file
                if os.path.exists(file_path):
                    os.remove(file_path)
                
                return Response({
                    'status': 'success',
                    'message': 'File processed successfully',
                    'data': result
                }, status=status.HTTP_201_CREATED)
                
            except ValidationError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {'error': f'Error processing file: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _save_health_data(self, data, user):
        """Save processed health data to the database."""
        result = {
            'steps_imported': 0,
            'heart_rate_imported': 0,
            'sleep_imported': 0,
            'workouts_imported': 0,
            'daily_summaries_updated': 0
        }
        
        with transaction.atomic():
            # Save step counts
            if 'steps' in data and data['steps']:
                step_instances = [
                    StepCount(
                        user=user,
                        date=datetime.strptime(step['date'], '%Y-%m-%d').date() if 'date' in step else timezone.now().date(),
                        start_time=datetime.strptime(step.get('start_time', '00:00:00'), '%H:%M:%S').time(),
                        end_time=datetime.strptime(step.get('end_time', '23:59:59'), '%H:%M:%S').time(),
                        count=step.get('count', 0),
                        distance=step.get('distance', 0),
                        calories=step.get('calories', 0),
                        speed=step.get('speed', 0),
                        device_uuid=step.get('device_uuid', DEFAULT_DEVICE_UUID)
                    ) for step in data['steps']
                ]
                StepCount.objects.bulk_create(step_instances, ignore_conflicts=True)
                result['steps_imported'] = len(step_instances)
            
            # Save heart rate data
            if 'heart_rate' in data and data['heart_rate']:
                hr_instances = [
                    HeartRate(
                        user=user,
                        timestamp=datetime.strptime(hr['timestamp'], '%Y-%m-%d %H:%M:%S') if 'timestamp' in hr else timezone.now(),
                        heart_rate=hr.get('heart_rate'),
                        comment=hr.get('comment', '')
                    ) for hr in data['heart_rate']
                ]
                HeartRate.objects.bulk_create(hr_instances, ignore_conflicts=True)
                result['heart_rate_imported'] = len(hr_instances)
            
            # Save sleep data
            if 'sleep' in data and data['sleep']:
                sleep_instances = [
                    Sleep(
                        user=user,
                        start_time=datetime.strptime(sleep['start_time'], '%Y-%m-%d %H:%M:%S') if 'start_time' in sleep else timezone.now(),
                        end_time=datetime.strptime(sleep['end_time'], '%Y-%m-%d %H:%M:%S') if 'end_time' in sleep else timezone.now(),
                        sleep_status=sleep.get('sleep_status', 'asleep'),
                        comment=sleep.get('comment', '')
                    ) for sleep in data['sleep']
                ]
                Sleep.objects.bulk_create(sleep_instances, ignore_conflicts=True)
                result['sleep_imported'] = len(sleep_instances)
            
            # Save workouts
            if 'workouts' in data and data['workouts']:
                workout_instances = [
                    Workout(
                        user=user,
                        start_time=datetime.strptime(workout['start_time'], '%Y-%m-%d %H:%M:%S') if 'start_time' in workout else timezone.now(),
                        end_time=datetime.strptime(workout['end_time'], '%Y-%m-%d %H:%M:%S') if 'end_time' in workout else timezone.now(),
                        exercise_type=workout.get('exercise_type', 'other'),
                        calories=workout.get('calories', 0),
                        distance=workout.get('distance', 0),
                        duration=workout.get('duration', 0),
                        comment=workout.get('comment', '')
                    ) for workout in data['workouts']
                ]
                Workout.objects.bulk_create(workout_instances, ignore_conflicts=True)
                result['workouts_imported'] = len(workout_instances)
            
            # Update daily summaries
            result['daily_summaries_updated'] = self._update_daily_summaries(user)
            
        return result
    
    def _update_daily_summaries(self, user):
        """Update daily summaries based on the imported data."""
        # Get the most recent date with step data
        latest_step = StepCount.objects.filter(user=user).order_by('-date').first()
        if not latest_step:
            return 0
            
        # Calculate summary for the latest date
        daily_steps = StepCount.objects.filter(
            user=user,
            date=latest_step.date
        ).aggregate(
            total_steps=Sum('count'),
            total_distance=Sum('distance'),
            total_calories=Sum('calories'),
            active_time=Sum(
                (F('end_time__hour') * 3600 + F('end_time__minute') * 60 + F('end_time__second')) -
                (F('start_time__hour') * 3600 + F('start_time__minute') * 60 + F('start_time__second'))
            )
        )
        
        # Create or update the daily summary
        DailySummary.objects.update_or_create(
            user=user,
            date=latest_step.date,
            defaults={
                'step_count': daily_steps['total_steps'] or 0,
                'distance': daily_steps['total_distance'] or 0,
                'calories': daily_steps['total_calories'] or 0,
                'active_time': daily_steps['active_time'] or 0
            }
        )
        
        return 1

    def process_samsung_health_data(self, file_path):
        """Process Samsung Health data from the uploaded file."""
        try:
            # Extract data based on file type
            if file_path.endswith('.json'):
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                return self._process_json_data(data)
                
            elif file_path.endswith(('.csv', '.xls', '.xlsx')):
                df = pd.read_csv(file_path) if file_path.endswith('.csv') else pd.read_excel(file_path)
                return self._process_dataframe(df)
                
        except Exception as e:
            raise Exception(f"Error processing file: {str(e)}")

    def _process_json_data(self, data):
        """Process JSON data from Samsung Health export."""
        try:
            # This is a simplified example - adjust based on actual Samsung Health export format
            step_data = []
            daily_summaries = {}
            
            # Example structure - adjust according to actual export format
            for item in data.get('data', []):
                try:
                    date = datetime.strptime(item.get('date'), '%Y-%m-%d').date()
                    steps = int(item.get('step_count', 0))
                    distance = float(item.get('distance', 0))
                    calories = float(item.get('calories', 0))
                    
                    # Add to step data
                    step_data.append(StepCount(
                        date=date,
                        start_time=datetime.combine(date, datetime.min.time()),
                        end_time=datetime.combine(date, datetime.max.time()),
                        count=steps,
                        distance=distance * 1000,  # Convert km to meters
                        calories=calories,
                        speed=0,  # Calculate if available
                        device_uuid='samsung_health_import'
                    ))
                    
                    # Update daily summary
                    if date not in daily_summaries:
                        daily_summaries[date] = {
                            'step_count': 0,
                            'distance': 0,
                            'calories': 0,
                            'active_time': 0
                        }
                    
                    daily_summaries[date]['step_count'] += steps
                    daily_summaries[date]['distance'] += distance
                    daily_summaries[date]['calories'] += calories
                    
                except (ValueError, KeyError) as e:
                    continue
            
            # Create daily summary objects
            daily_summary_objects = [
                DailySummary(
                    date=date,
                    step_count=values['step_count'],
                    distance=values['distance'] * 1000,  # Convert km to meters
                    calories=values['calories'],
                    active_time=values.get('active_time', 0)
                )
                for date, values in daily_summaries.items()
            ]
            
            return step_data, daily_summary_objects
            
        except Exception as e:
            raise Exception(f"Error processing JSON data: {str(e)}")

    def _process_dataframe(self, df):
        """Process data from CSV/Excel files."""
        try:
            # Standardize column names (case insensitive)
            df.columns = df.columns.str.lower()
            
            # Map possible column names to standard names
            column_mapping = {
                'date': ['date', 'day', 'timestamp'],
                'steps': ['steps', 'step_count', 'step count'],
                'distance': ['distance', 'distance (km)', 'distance_km'],
                'calories': ['calories', 'calories_burned', 'calories burned']
            }
            
            # Find actual column names in the dataframe
            actual_columns = {}
            for standard_name, possible_names in column_mapping.items():
                for name in possible_names:
                    if name in df.columns:
                        actual_columns[standard_name] = name
                        break
            
            if 'date' not in actual_columns or 'steps' not in actual_columns:
                raise ValueError("Required columns (date, steps) not found in the file")
            
            # Process the data
            step_data = []
            daily_summaries = {}
            
            for _, row in df.iterrows():
                try:
                    date = pd.to_datetime(row[actual_columns['date']]).date()
                    steps = int(row[actual_columns['steps']])
                    
                    # Get optional fields if they exist
                    distance = float(row[actual_columns.get('distance', 0)]) if 'distance' in actual_columns else 0
                    calories = float(row[actual_columns.get('calories', 0)]) if 'calories' in actual_columns else 0
                    
                    # Add to step data
                    step_data.append(StepCount(
                        date=date,
                        start_time=datetime.combine(date, datetime.min.time()),
                        end_time=datetime.combine(date, datetime.max.time()),
                        count=steps,
                        distance=distance * 1000,  # Convert km to meters if needed
                        calories=calories,
                        speed=0,  # Calculate if available
                        device_uuid='file_import'
                    ))
                    
                    # Update daily summary
                    if date not in daily_summaries:
                        daily_summaries[date] = {
                            'step_count': 0,
                            'distance': 0,
                            'calories': 0,
                            'active_time': 0
                        }
                    
                    daily_summaries[date]['step_count'] += steps
                    daily_summaries[date]['distance'] += distance
                    daily_summaries[date]['calories'] += calories
                    
                except (ValueError, KeyError) as e:
                    continue
            
            # Create daily summary objects
            daily_summary_objects = [
                DailySummary(
                    date=date,
                    step_count=values['step_count'],
                    distance=values['distance'] * 1000,  # Convert km to meters
                    calories=values['calories'],
                    active_time=values['active_time']
                )
                for date, values in daily_summaries.items()
            ]
            
            return step_data, daily_summary_objects
            
        except Exception as e:
            raise Exception(f"Error processing tabular data: {str(e)}")

    def post(self, request, *args, **kwargs):
        """Handle file upload and processing."""
        if 'file' not in request.FILES:
            return Response(
                {'message': 'No file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        file_obj = request.FILES['file']
        
        # Validate file size
        if file_obj.size > self.MAX_UPLOAD_SIZE:
            return Response(
                {'message': f'File too large. Maximum size is {self.MAX_UPLOAD_SIZE/1024/1024}MB'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file type
        is_valid, error_message = self.validate_file_type(file_obj)
        if not is_valid:
            return Response(
                {'message': error_message or 'Invalid file type'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Save the uploaded file temporarily
        temp_dir = tempfile.mkdtemp()
        temp_file_path = os.path.join(temp_dir, file_obj.name)
        
        try:
            with open(temp_file_path, 'wb+') as destination:
                for chunk in file_obj.chunks():
                    destination.write(chunk)
            
            # Process the file
            step_data, daily_summaries = self.process_samsung_health_data(temp_file_path)
            
            # Save to database in a transaction
            with transaction.atomic():
                # Delete existing data for these dates to avoid duplicates
                if step_data:
                    dates = list(set(step.date for step in step_data))
                    StepCount.objects.filter(date__in=dates).delete()
                    DailySummary.objects.filter(date__in=dates).delete()
                    
                    # Bulk create new records
                    StepCount.objects.bulk_create(step_data)
                    DailySummary.objects.bulk_create(daily_summaries)
            
            return Response({
                'message': 'File processed successfully',
                'steps_imported': len(step_data),
                'daily_summaries': len(daily_summaries)
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'message': f'Error processing file: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        finally:
            # Clean up temporary files
            try:
                if os.path.exists(temp_file_path):
                    os.remove(temp_file_path)
                if os.path.exists(temp_dir):
                    os.rmdir(temp_dir)
            except Exception as e:
                print(f"Error cleaning up temporary files: {str(e)}")
                pass
