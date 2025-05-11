import os
import time
import pandas as pd
from django.core.management.base import BaseCommand
from health_data.models import StepCount, DailySummary
from datetime import datetime, timedelta
from django.utils import timezone
import pytz
import numpy as np

class Command(BaseCommand):
    help = 'Import Samsung Health data from CSV files'

    def add_arguments(self, parser):
        parser.add_argument('data_dir', type=str, help='Directory containing Samsung Health CSV files')

    def handle(self, *args, **options):
        data_dir = options['data_dir']
        self.import_step_counts(data_dir)
        self.import_daily_summaries(data_dir)

    def import_step_counts(self, data_dir):
        """Import step count data from CSV file."""
        file_path = os.path.join(data_dir, 'com.samsung.shealth.tracker.pedometer_step_count.20250511020679.csv')
        if not os.path.exists(file_path):
            self.stdout.write(self.style.WARNING(f'Step count file not found: {file_path}'))
            return

        self.stdout.write(f'Importing step counts from {file_path}...')
        
        try:
            # Read the CSV file, skipping the first two rows which contain metadata
            # The actual data starts from the 3rd row
            df = pd.read_csv(file_path, skiprows=2, header=None)
            
            # Define column indices based on the CSV structure
            # ['60000', '4', '0', '98', '2025-05-10 15:23:00.000', 'Unnamed: 5', 'Unnamed: 6', 
            #  '2025-05-10 15:25:00.009', '2025-05-10 15:23:02.819', '98.1', '1.2213265', '73.27959', 
            #  '3.4752014', 'UTC+0530', 'InfE8IGVow', 'com.sec.android.app.shealth', '2025-05-10 15:24:00.000', 
            #  '720e5308-7f31-47d3-8c74-73c8338db092', 'Unnamed: 18']
            
            # Map the columns to their indices
            COLS = {
                'duration': 0,
                'version_code': 1,
                'run_step': 2,
                'walk_step': 3,
                'start_time': 4,
                'update_time': 7,
                'create_time': 8,
                'count': 9,
                'speed': 10,
                'distance': 11,
                'calories': 12,
                'timezone': 13,
                'device_uuid': 14,
                'pkg_name': 15,
                'end_time': 16,
                'data_uuid': 17
            }
            
            count = 0
            
            for _, row in df.iterrows():
                try:
                    # Skip rows with missing timestamps
                    if pd.isna(row[COLS['start_time']]) or pd.isna(row[COLS['end_time']]):
                        continue
                        
                    # Extract start and end times from the row and make them timezone-aware
                    start_time = timezone.make_aware(
                        datetime.strptime(
                            str(row[COLS['start_time']]).strip(),
                            '%Y-%m-%d %H:%M:%S.%f'
                        ),
                        timezone=timezone.get_default_timezone()
                    )
                    end_time = timezone.make_aware(
                        datetime.strptime(
                            str(row[COLS['end_time']]).strip(),
                            '%Y-%m-%d %H:%M:%S.%f'
                        ),
                        timezone=timezone.get_default_timezone()
                    )
                    
                    # Get step counts and other metrics
                    walk_steps = int(float(row[COLS['walk_step']])) if not pd.isna(row[COLS['walk_step']]) else 0
                    run_steps = int(float(row[COLS['run_step']])) if not pd.isna(row[COLS['run_step']]) else 0
                    total_steps = walk_steps + run_steps
                    
                    # Get other metrics with proper NaN handling
                    distance = float(row[COLS['distance']]) if not pd.isna(row[COLS['distance']]) else 0.0
                    calories = float(row[COLS['calories']]) if not pd.isna(row[COLS['calories']]) else 0.0
                    speed = float(row[COLS['speed']]) if not pd.isna(row[COLS['speed']]) else 0.0
                    device_uuid = str(row[COLS['device_uuid']]) if not pd.isna(row[COLS['device_uuid']]) else ''
                    
                    StepCount.objects.create(
                        date=start_time.date(),
                        start_time=start_time,
                        end_time=end_time,
                        count=total_steps,
                        distance=distance,
                        calories=calories,
                        speed=speed,
                        device_uuid=device_uuid
                    )
                    count += 1
                except Exception as e:
                    self.stderr.write(f"Error processing row: {str(e)}")
                    continue
            
            self.stdout.write(self.style.SUCCESS(f'Successfully imported {count} step counts'))
            
        except Exception as e:
            self.stderr.write(f'Error importing step counts: {str(e)}')

    def import_daily_summaries(self, data_dir):
        """Import daily summary data from CSV file."""
        file_path = os.path.join(data_dir, 'com.samsung.shealth.tracker.pedometer_day_summary.20250511020679.csv')
        if not os.path.exists(file_path):
            self.stdout.write(self.style.WARNING(f'Daily summary file not found: {file_path}'))
            return

        self.stdout.write(f'Importing daily summaries from {file_path}...')
        
        try:
            # Read the CSV file, skipping the first two rows which contain metadata
            # The actual data starts from the 3rd row
            df = pd.read_csv(file_path, skiprows=2, header=None)
            
            # Define column indices based on the CSV structure
            # ['62950170', '888', '5c9db927-fdd8-4891-8823-f4f1b32a520f.binning_data.json', '549859', '6000', 
            #  '62950170.1', '13', '2025-05-10 18:30:00.536', 'com.sec.android.app.shealth', '2025-05-10 15:23:02.898', 
            #  '5c9db927-fdd8-4891-8823-f4f1b32a520f.source_info.json', '1.270005', '698.324', '33.73201', '875', 
            #  'VfS0qUERdZ', 'com.sec.android.app.shealth.1', '0', '5c9db927-fdd8-4891-8823-f4f1b32a520f.achievement.json', 
            #  '5c9db927-fdd8-4891-8823-f4f1b32a520f', '1746835200000', 'Unnamed: 21']
            
            # Map the columns to their indices
            COLS = {
                'create_sh_ver': 0,
                'step_count': 1,
                'binning_data': 2,
                'active_time': 3,
                'recommendation': 4,
                'modify_sh_ver': 6,
                'run_step_count': 7,
                'update_time': 8,
                'source_package_name': 9,
                'create_time': 10,
                'source_info': 11,
                'speed': 12,
                'distance': 13,
                'calories': 14,
                'walk_step_count': 15,
                'device_uuid': 16,
                'pkg_name': 17,
                'healthy_step': 18,
                'achievement': 19,
                'data_uuid': 20,
                'day_time': 21
            }
            
            count = 0
            
            for _, row in df.iterrows():
                try:
                    # Get the date from the day_time column (converting from timestamp)
                    day_timestamp = int(float(row[COLS['day_time']])) / 1000 if not pd.isna(row[COLS['day_time']]) else time.time()
                    day_time = timezone.make_aware(
                        datetime.fromtimestamp(day_timestamp),
                        timezone=timezone.get_default_timezone()
                    )
                    
                    # Get metrics with proper NaN handling
                    step_count = int(float(row[COLS['step_count']])) if not pd.isna(row[COLS['step_count']]) else 0
                    distance = float(row[COLS['distance']]) if not pd.isna(row[COLS['distance']]) else 0.0
                    calories = float(row[COLS['calories']]) if not pd.isna(row[COLS['calories']]) else 0.0
                    active_time = int(float(row[COLS['active_time']])) if not pd.isna(row[COLS['active_time']]) else 0
                    
                    # Use get_or_create to handle duplicate dates
                    DailySummary.objects.update_or_create(
                        date=day_time.date(),
                        defaults={
                            'step_count': step_count,
                            'distance': distance,
                            'calories': calories,
                            'active_time': active_time
                        }
                    )
                    count += 1
                except Exception as e:
                    self.stderr.write(f"Error processing row: {str(e)}")
                    continue
            
            self.stdout.write(self.style.SUCCESS(f'Successfully imported {count} daily summaries'))
            
        except Exception as e:
            self.stderr.write(f'Error importing daily summaries: {str(e)}')
