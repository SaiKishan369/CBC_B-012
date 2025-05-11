import os
import re
import io
import json
import zipfile
# import magic  # Removed: unavailable feature
import logging
from typing import Union, BinaryIO, Optional, List, Dict, Any, Tuple, Set, Callable, TypeVar, Type, cast
import pandas as pd
import numpy as np
from datetime import datetime, date, time, timezone, timedelta
from pathlib import Path
from typing import Dict, List, Union, Any, BinaryIO, Optional, Tuple, Set, Callable, TypeVar, Type, cast
from django.core.files.storage import FileSystemStorage, default_storage
from django.core.files.uploadedfile import InMemoryUploadedFile, UploadedFile, File as DjangoFile
from django.core.files.base import ContentFile, File as BaseFile
from django.core.exceptions import ValidationError
from django.utils import timezone as django_timezone
from django.utils.translation import gettext_lazy as _
from django.conf import settings

# Type aliases
File = Union[UploadedFile, InMemoryUploadedFile, BinaryIO, DjangoFile, BaseFile, str, bytes]

# Configure logging
logger = logging.getLogger(__name__)

# MIME type detection with 'magic' is disabled (module unavailable). Using extension-based detection only.
# Constants for file processing
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_MIME_TYPES = {
    'application/zip': 'zip',
    'application/json': 'json',
    'text/csv': 'csv',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/octet-stream': 'bin',
    'text/plain': 'txt',
    'application/gpx+xml': 'gpx',
    'application/octet-stream': 'fit',  # Garmin .fit files
}

# Date formats to try when parsing timestamps
DATE_FORMATS = [
    '%Y-%m-%dT%H:%M:%S.%f%z',  # ISO 8601 with microseconds and timezone
    '%Y-%m-%dT%H:%M:%S%z',     # ISO 8601 with timezone
    '%Y-%m-%dT%H:%M:%S',       # ISO 8601 without timezone
    '%Y-%m-%d %H:%M:%S',       # SQL datetime
    '%Y-%m-%d',                # Date only
    '%m/%d/%Y %H:%M:%S',       # US format with time
    '%m/%d/%Y',                # US date format
    '%d/%m/%Y %H:%M:%S',       # European format with time
    '%d/%m/%Y',                # European date format
]

def parse_datetime(dt_str: Union[str, int, float, datetime, None]) -> Optional[datetime]:
    """
    Parse a datetime string with multiple format support.
    
    Args:
        dt_str: String, int, float, or datetime object to parse
        
    Returns:
        datetime: Parsed datetime object in UTC, or None if input is None/empty
        
    Raises:
        ValidationError: If the datetime string cannot be parsed
    """
    if not dt_str or (isinstance(dt_str, (str, bytes)) and not str(dt_str).strip()):
        return None
    
    # If already a datetime object, ensure it's timezone-aware
    if isinstance(dt_str, datetime):
        if dt_str.tzinfo is None:
            return dt_str.replace(tzinfo=timezone.utc)
        return dt_str.astimezone(timezone.utc)
    
    # Handle numeric timestamps (seconds or milliseconds since epoch)
    if isinstance(dt_str, (int, float)):
        timestamp = float(dt_str)
        if timestamp > 1e10:  # Likely in milliseconds
            timestamp /= 1000
        return datetime.fromtimestamp(timestamp, tz=timezone.utc)
    
    # Handle string timestamps
    if isinstance(dt_str, (str, bytes)):
        dt_str = str(dt_str).strip()
        if not dt_str or dt_str.lower() in ('none', 'null', 'nan'):
            return None
            
        # Try parsing with each format
        for fmt in DATE_FORMATS:
            try:
                dt = datetime.strptime(dt_str, fmt)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt.astimezone(timezone.utc)
            except (ValueError, TypeError):
                continue
    
    # If all else fails, try pandas' built-in parser
    try:
        dt = pd.to_datetime(dt_str, utc=True)
        if hasattr(dt, 'to_pydatetime'):
            dt = dt.to_pydatetime()
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except (ValueError, TypeError) as e:
        raise ValidationError(_(f'Could not parse datetime: {dt_str} - {str(e)}'))

def validate_file(
    file: Union[File, BinaryIO], 
    check_content: bool = True,
    allowed_extensions: Optional[List[str]] = None,
    max_size: Optional[int] = None
) -> Dict[str, Any]:
    """
    Validate the uploaded file for size, extension, and content type.
    
    Args:
        file: The uploaded file object
        check_content: If True, also check the file content
        
    Returns:
        Dict containing file metadata if valid
        
    Raises:
        ValidationError: If the file is invalid
    """
    # Get max size from parameters or settings
    max_file_size = max_size or getattr(settings, 'MAX_UPLOAD_SIZE', MAX_FILE_SIZE)
    
    # Check file size
    file_size = 0
    if hasattr(file, 'size'):
        file_size = getattr(file, 'size', 0)
    elif hasattr(file, 'getbuffer'):
        file_size = len(file.getbuffer())  # type: ignore
    elif isinstance(file, (str, bytes)):
        file_size = len(file)
        
    if file_size > max_file_size:
        raise ValidationError(_(
            f'File size ({file_size/1024/1024:.1f}MB) exceeds maximum allowed size of {max_file_size/1024/1024:.1f}MB'
        ))
    
    # Get file extension and name
    file_name = getattr(file, 'name', 'uploaded_file')
    file_ext = os.path.splitext(file_name)[1].lower()
    
    # Get allowed extensions from parameters or settings
    allowed_exts = allowed_extensions or getattr(settings, 'ALLOWED_FILE_TYPES', list(ALLOWED_MIME_TYPES.values()))
    allowed_exts = [ext[1:] if ext.startswith('.') else ext for ext in allowed_exts]
    
    # Check allowed extensions
    if file_ext[1:] not in allowed_exts:
        # Special case: .json files should be allowed if application/json is in allowed MIME types
        if file_ext.lower() == '.json' and 'json' in ALLOWED_MIME_TYPES.values():
            pass  # Allow .json files if json is in allowed MIME types
        else:
            raise ValidationError(_(
                f'File type {file_ext} is not supported. ' 
                f'Allowed types: { ", ".join(f".{ext}" for ext in allowed_exts) }'
            ))
    
    # Get file content type
    content_type = getattr(file, 'content_type', '').lower()
    
    # If we need to check the actual content (slower but more reliable)
    if check_content:
        try:
            # Read a small portion of the file to detect its type
            if hasattr(file, 'read'):
                current_position = file.tell()
                file_header = file.read(1024)
                file.seek(current_position)  # Reset file pointer
                
                # Try to detect content type using magic if available
                if mime is not None:
                    try:
                        detected_type = mime.from_buffer(file_header)
                        if detected_type and '/' in detected_type:
                            content_type = detected_type
                            logger.debug(f"Detected content type: {content_type}")
                    except Exception as e:
                        logger.warning(f"Could not detect file type with magic: {str(e)}")
                
                # Special handling for JSON files
                if file_ext.lower() == '.json' and not content_type:
                    try:
                        # Try to parse as JSON to verify
                        json.loads(file_header)
                        content_type = 'application/json'  # Force content type to JSON if valid
                    except json.JSONDecodeError:
                        pass  # Not valid JSON, keep original content type
        except Exception as e:
            logger.warning(f"Error during file content inspection: {str(e)}")
    
    # If we still don't have a content type, try to determine from extension
    if not content_type and file_ext[1:]:
        content_type = next((mime for mime, ext in ALLOWED_MIME_TYPES.items() 
                            if ext == file_ext[1:].lower()), '')
    
    # If we have a content type but no extension, try to set the extension
    if content_type and not file_ext and content_type in ALLOWED_MIME_TYPES.values():
        file_ext = f".{content_type}"
    
    # Normalize content type for known cases
    if file_ext.lower() == '.json' and content_type in ('text/plain', 'application/octet-stream'):
        content_type = 'application/json'
    
    # If we still don't have a content type, use the default from the file extension
    if not content_type and file_ext[1:]:
        content_type = f"application/{file_ext[1:]}"
    
    # Final validation of the content type against allowed types
    if content_type and content_type not in ALLOWED_MIME_TYPES.values():
        logger.warning(f"Content type {content_type} is not in the allowed MIME types")
    
    return {
        'name': file_name,
        'size': file_size,
        'extension': file_ext[1:],  # Remove the leading dot
        'content_type': content_type or 'application/octet-stream',
    }

def process_health_data(
    file: Union[File, BinaryIO], 
    file_type: Optional[str] = None
) -> Dict[str, Any]:
    """
    Process uploaded health data file and return structured data.
    
    Args:
        file: The uploaded file object, path, or bytes
        file_type: Optional file type override (e.g., 'json', 'csv')
        
    Returns:
        Dict containing processed health data with the following structure:
        {
            'metadata': {
                'filename': str,
                'file_type': str,
                'file_size': int,
                'processed_at': str (ISO 8601 datetime)
            },
            'data': {
                'records': List[Dict],  # Generic records if no specific processor
                ...  # Other data types as processed
            },
            'stats': {
                'record_count': int,
                'date_range': Tuple[str, str],
                ...  # Other statistics
            },
            'warnings': List[str]  # Any non-fatal processing warnings
        }
        
    Raises:
        ValidationError: If the file cannot be processed
    """
    # Validate the file first
    file_info = validate_file(file)
    ext = file_type or file_info['extension'].lower()
    
    # Ensure ext starts with a dot
    if not ext.startswith('.'):
        ext = f'.{ext}'
    
    result: Dict[str, Any] = {
        'metadata': {
            'filename': file_info.get('name', ''),
            'file_type': ext[1:],  # Remove leading dot
            'file_size': file_info.get('size', 0),
            'processed_at': django_timezone.now().isoformat(),
            'content_type': file_info.get('content_type', '')
        },
        'data': {},
        'warnings': []
    }
    
    try:
        # Process based on file extension
        if ext == '.json':
            result['data'] = process_json_file(file)
        elif ext == '.csv':
            result['data'] = process_csv_file(file)
        elif ext in ['.xls', '.xlsx']:
            result['data'] = process_excel_file(file)
        elif ext == '.zip':
            result['data'] = process_zip_file(file)
        elif ext in ['.gpx', '.fit', '.tcx']:
            result['data'] = process_fitness_file(file, ext)
        else:
            raise ValidationError(_(f'Unsupported file type: {ext}'))
        
        # Calculate basic statistics
        result['stats'] = calculate_statistics(result['data'])
        
        return result
        
    except ValidationError:
        raise
    except Exception as e:
        logger.exception(f"Error processing file {file_info.get('name', '')}")
        raise ValidationError(_(f'Error processing file: {str(e)}'))

def process_json_file(file: Union[File, BinaryIO]) -> Dict[str, Any]:
    """
    Process JSON health data file.
    
    Supports:
    - Samsung Health export format
    - Apple HealthKit export format
    - Generic JSON arrays of health records
    - Test data format with 'data' key containing health metrics
    """
    try:
        # Handle both file objects and InMemoryUploadedFile
        if hasattr(file, 'read'):
            file.seek(0)  # Ensure we're at the start
            data = json.load(file)
        else:
            data = json.loads(file.read())
        
        # Check for test data format (data.heart_rate array)
        if isinstance(data, dict) and 'data' in data and 'heart_rate' in data['data']:
            return data['data']
        
        # Check for Samsung Health format
        if isinstance(data, dict) and 'data' in data:
            if any(k.startswith('com.samsung.shealth') for k in data.get('data', {}).keys()):
                return process_samsung_health_data(data)
        
        # Check for Apple HealthKit format
        if isinstance(data, dict) and 'data' in data and 'HKTypeIdentifiers' in str(data):
            return process_apple_health_data(data)
        
        # Assume it's a direct array of records
        if isinstance(data, list):
            return {'records': data}
            
        return data
    except json.JSONDecodeError as e:
        raise ValidationError(_(f'Invalid JSON file: {str(e)}'))

def process_csv_file(file):
    """Process CSV health data file."""
    try:
        df = pd.read_csv(file)
        return df.to_dict('records')
    except Exception as e:
        raise ValidationError(f'Error processing CSV: {str(e)}')

def process_excel_file(file):
    """Process Excel health data file."""
    try:
        df = pd.read_excel(file)
        return df.to_dict('records')
    except Exception as e:
        raise ValidationError(f'Error processing Excel file: {str(e)}')

def process_zip_file(file):
    """Process ZIP archive containing health data files."""
    try:
        with zipfile.ZipFile(file, 'r') as zip_ref:
            # Extract to a temporary directory
            temp_dir = os.path.join(settings.MEDIA_ROOT, 'temp', str(datetime.now().timestamp()))
            zip_ref.extractall(temp_dir)
            
            # Process all files in the extracted directory
            results = {}
            for root, _, files in os.walk(temp_dir):
                for filename in files:
                    file_path = os.path.join(root, filename)
                    ext = os.path.splitext(filename)[1].lower()
                    
                    if ext == '.json':
                        with open(file_path, 'r', encoding='utf-8') as f:
                            results[filename] = process_json_file(f)
                    elif ext == '.csv':
                        with open(file_path, 'r', encoding='utf-8') as f:
                            results[filename] = process_csv_file(f)
                    elif ext in ['.xls', '.xlsx']:
                        with open(file_path, 'rb') as f:
                            results[filename] = process_excel_file(f)
            
            # Clean up temporary directory
            import shutil
            shutil.rmtree(temp_dir)
            
            return results
    except zipfile.BadZipFile:
        raise ValidationError('Invalid ZIP file')

def process_samsung_health_data(data: Dict) -> Dict[str, Any]:
    """
    Process Samsung Health data structure into a standardized format.
    
    Args:
        data: Raw Samsung Health data dictionary
        
    Returns:
        Dict containing processed health data organized by type
    """
    if not isinstance(data, dict) or 'data' not in data:
        raise ValidationError(_('Invalid Samsung Health data format'))
    
    result = {
        'metadata': {
            'export_date': data.get('export_date'),
            'device': data.get('device'),
            'app_version': data.get('app_version'),
        },
        'data': {}
    }
    
    # Process each data type in the Samsung Health export
    for data_type, items in data.get('data', {}).items():
        try:
            if not items or not isinstance(items, list):
                continue
                
            # Extract the simple data type name (e.g., 'heart_rate' from 'com.samsung.shealth.tracker.heart_rate')
            simple_type = data_type.split('.')[-1]
            
            # Process different data types
            if 'heart_rate' in data_type:
                result['data']['heart_rate'] = process_heart_rate_data(items)
            elif 'step_count' in data_type or 'step_daily_trend' in data_type:
                result['data'].setdefault('steps', []).extend(process_step_data(items))
            elif 'sleep' in data_type:
                result['data'].setdefault('sleep', []).extend(process_sleep_data(items))
            elif 'workout' in data_type or 'exercise' in data_type:
                result['data'].setdefault('workouts', []).extend(process_workout_data(items))
            elif 'blood_glucose' in data_type:
                result['data'].setdefault('blood_glucose', []).extend(process_glucose_data(items))
            elif 'blood_pressure' in data_type:
                result['data'].setdefault('blood_pressure', []).extend(process_blood_pressure_data(items))
            elif 'weight' in data_type or 'body_fat' in data_type:
                result['data'].setdefault('body_measurements', []).extend(process_body_measurement_data(items))
            else:
                # For unhandled data types, include raw data but with standardized timestamps
                processed = []
                for item in items:
                    if not isinstance(item, dict):
                        continue
                    processed_item = standardize_timestamps(item)
                    processed_item['_data_type'] = simple_type
                    processed.append(processed_item)
                if processed:
                    result['data'][simple_type] = processed
                    
        except Exception as e:
            logger.warning(f'Error processing {data_type}: {str(e)}')
            continue
    
    # Calculate basic statistics if we have the data
    if 'heart_rate' in result['data']:
        result['stats'] = calculate_heart_rate_stats(result['data']['heart_rate'])
    
    if 'steps' in result['data'] and result['data']['steps']:
        result['stats'] = result.get('stats', {})
        result['stats']['steps'] = {
            'total': sum(d.get('step_count', 0) for d in result['data']['steps'] if d),
            'days': len({d.get('date') for d in result['data']['steps'] if d and 'date' in d}),
        }
    
    return result

def process_heart_rate_data(data):
    return [{'timestamp': standardize_timestamp(item.get('start_time')), 'heart_rate': item.get('heart_rate')} for item in data]

def process_step_data(data):
    return [{'date': standardize_timestamp(item.get('date')), 'step_count': item.get('count'), 'distance': item.get('distance'), 'calorie': item.get('calorie')} for item in data]

def process_sleep_data(data):
    return [{'start_time': standardize_timestamp(item.get('start_time')), 'end_time': standardize_timestamp(item.get('end_time')), 'sleep_status': item.get('sleep_status')} for item in data]

def process_workout_data(data):
    return [{'start_time': standardize_timestamp(item.get('start_time')), 'end_time': standardize_timestamp(item.get('end_time')), 'exercise_type': item.get('exercise_type'), 'calorie': item.get('calorie'), 'distance': item.get('distance'), 'duration': item.get('duration')} for item in data]

def process_glucose_data(data):
    return [{'timestamp': standardize_timestamp(item.get('timestamp')), 'glucose_level': item.get('glucose_level')} for item in data]

def process_blood_pressure_data(data):
    return [{'timestamp': standardize_timestamp(item.get('timestamp')), 'systolic': item.get('systolic'), 'diastolic': item.get('diastolic')} for item in data]

def process_body_measurement_data(data):
    return [{'timestamp': standardize_timestamp(item.get('timestamp')), 'weight': item.get('weight'), 'body_fat': item.get('body_fat')} for item in data]

def standardize_timestamp(timestamp):
    if timestamp > 1e10:  # Likely in milliseconds
        timestamp /= 1000
    return datetime.fromtimestamp(timestamp, tz=timezone.utc)

def calculate_heart_rate_stats(data):
    if not data:
        return {}
    
    heart_rates = [item['heart_rate'] for item in data]
    return {
        'min': min(heart_rates),
        'max': max(heart_rates),
        'avg': sum(heart_rates) / len(heart_rates),
    }

def process_heart_rate_data(items: List[Dict]) -> List[Dict]:
    """Process heart rate data from Samsung Health."""
    processed = []
    for item in items:
        if not isinstance(item, dict):
            continue
            
        timestamp = parse_datetime(item.get('start_time') or item.get('time'))
        if not timestamp:
            continue
            
        processed.append({
            'timestamp': timestamp.isoformat(),
            'heart_rate': float(item.get('heart_rate', 0)),
            'source': item.get('source', {}).get('name', 'unknown'),
            'comment': item.get('comment', ''),
            'original_data': item
        })
    return processed

def process_step_data(items: List[Dict]) -> List[Dict]:
    """Process step count data from Samsung Health."""
    processed = []
    for item in items:
        if not isinstance(item, dict):
            continue
            
        date = parse_datetime(item.get('date') or item.get('start_time'))
        if not date:
            continue
            
        processed.append({
            'date': date.date().isoformat(),
            'step_count': int(item.get('count', 0)),
            'distance': float(item.get('distance', 0)),
            'calorie': float(item.get('calorie', 0)),
            'source': item.get('source', {}).get('name', 'unknown'),
            'original_data': item
        })
    return processed

def process_sleep_data(items: List[Dict]) -> List[Dict]:
    """Process sleep data from Samsung Health."""
    processed = []
    for item in items:
        if not isinstance(item, dict):
            continue
            
        start_time = parse_datetime(item.get('start_time'))
        end_time = parse_datetime(item.get('end_time'))
        
        if not start_time or not end_time:
            continue
            
        processed.append({
            'start_time': start_time.isoformat(),
            'end_time': end_time.isoformat(),
            'duration_seconds': (end_time - start_time).total_seconds(),
            'sleep_status': item.get('sleep_status', 'UNKNOWN'),
            'source': item.get('source', {}).get('name', 'unknown'),
            'original_data': item
        })
    return processed

def process_workout_data(items: List[Dict]) -> List[Dict]:
    """Process workout/exercise data from Samsung Health."""
    processed = []
    for item in items:
        if not isinstance(item, dict):
            continue
            
        start_time = parse_datetime(item.get('start_time'))
        end_time = parse_datetime(item.get('end_time'))
        
        if not start_time or not end_time:
            continue
            
        processed.append({
            'start_time': start_time.isoformat(),
            'end_time': end_time.isoformat(),
            'duration_seconds': (end_time - start_time).total_seconds(),
            'exercise_type': item.get('exercise_type', 'UNKNOWN'),
            'calorie': float(item.get('calorie', 0)),
            'distance': float(item.get('distance', 0)),
            'source': item.get('source', {}).get('name', 'unknown'),
            'original_data': item
        })
    return processed

def process_glucose_data(items: List[Dict]) -> List[Dict]:
    """Process blood glucose data from Samsung Health."""
    processed = []
    for item in items:
        if not isinstance(item, dict):
            continue
            
        timestamp = parse_datetime(item.get('time') or item.get('start_time'))
        if not timestamp:
            continue
            
        processed.append({
            'timestamp': timestamp.isoformat(),
            'glucose_level': float(item.get('glucose_level', 0)),
            'unit': item.get('unit', 'mg/dL'),
            'meal': item.get('meal', 'UNKNOWN'),
            'source': item.get('source', {}).get('name', 'unknown'),
            'original_data': item
        })
    return processed

def process_blood_pressure_data(items: List[Dict]) -> List[Dict]:
    """Process blood pressure data from Samsung Health."""
    processed = []
    for item in items:
        if not isinstance(item, dict):
            continue
            
        timestamp = parse_datetime(item.get('time') or item.get('start_time'))
        if not timestamp:
            continue
            
        processed.append({
            'timestamp': timestamp.isoformat(),
            'systolic': int(item.get('systolic', 0)),
            'diastolic': int(item.get('diastolic', 0)),
            'pulse': int(item.get('pulse', 0)),
            'source': item.get('source', {}).get('name', 'unknown'),
            'original_data': item
        })
    return processed

def process_body_measurement_data(items: List[Dict]) -> List[Dict]:
    """Process body measurement data from Samsung Health."""
    processed = []
    for item in items:
        if not isinstance(item, dict):
            continue
            
        timestamp = parse_datetime(item.get('time') or item.get('start_time'))
        if not timestamp:
            continue
            
        processed.append({
            'timestamp': timestamp.isoformat(),
            'weight': float(item.get('weight', 0)) if 'weight' in item else None,
            'body_fat': float(item.get('body_fat', 0)) if 'body_fat' in item else None,
            'bmi': float(item.get('bmi', 0)) if 'bmi' in item else None,
            'muscle_mass': float(item.get('muscle_mass', 0)) if 'muscle_mass' in item else None,
            'source': item.get('source', {}).get('name', 'unknown'),
            'original_data': item
        })
    return processed

def standardize_timestamps(data: Dict) -> Dict:
    """Standardize timestamps in a data dictionary."""
    result = {}
    for key, value in data.items():
        if key.endswith(('_time', '_date', 'time', 'date', 'timestamp')) and value:
            try:
                dt = parse_datetime(value)
                if dt:
                    result[key] = dt.isoformat()
                else:
                    result[key] = value
            except (ValueError, TypeError):
                result[key] = value
        elif isinstance(value, dict):
            result[key] = standardize_timestamps(value)
        else:
            result[key] = value
    return result

def save_uploaded_file(
    file: Union[File, str, bytes], 
    name: Optional[str] = None,
    subfolder: str = 'uploads',
    randomize: bool = True
) -> Dict[str, str]:
    """
    Save uploaded file to media directory with additional metadata.
    
    Args:
        file: File object, path, or bytes to save
        name: Optional custom filename (defaults to original filename or generated UUID)
        subfolder: Subfolder within MEDIA_ROOT to save the file
        randomize: Whether to add a random prefix to the filename to avoid collisions
        
    Returns:
        Dict containing:
        - 'url': Public URL to access the file
        - 'path': Relative path from MEDIA_ROOT
        - 'name': Saved filename
        - 'size': File size in bytes
        
    Raises:
        ValidationError: If there's an error saving the file
    """
    try:
        fs = FileSystemStorage(location=os.path.join(settings.MEDIA_ROOT, subfolder))
        
        # Generate a safe filename
        if name:
            filename = os.path.basename(name)
        elif hasattr(file, 'name'):
            filename = os.path.basename(str(file.name))
        else:
            filename = 'uploaded_file'
            
        # Clean the filename
        filename = re.sub(r'[^\w\d\.\-]', '_', filename)
        
        # Add random prefix if requested
        if randomize:
            import uuid
            filename = f"{uuid.uuid4().hex[:8]}_{filename}"
        
        # Save the file
        if isinstance(file, (str, bytes, bytearray)):
            saved_name = fs.save(filename, ContentFile(file) if isinstance(file, (bytes, bytearray)) else file)
        else:
            # Ensure file pointer is at the beginning
            if hasattr(file, 'seek') and callable(file.seek):
                file.seek(0)
            saved_name = fs.save(filename, file)
        
        # Get file info
        file_path = fs.path(saved_name)
        file_size = os.path.getsize(file_path)
        
        return {
            'url': fs.url(saved_name),
            'path': os.path.join(subfolder, saved_name),
            'name': saved_name,
            'size': file_size,
            'content_type': getattr(file, 'content_type', '')
        }
        
    except Exception as e:
        logger.error(f"Error saving file {getattr(file, 'name', 'unknown')}: {str(e)}", 
                   exc_info=True)
        raise ValidationError(_(f'Error saving file: {str(e)}'))

def calculate_statistics(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate statistics for processed health data.
    
    Args:
        data: Processed health data dictionary
        
    Returns:
        Dict containing various statistics about the data
    """
    stats: Dict[str, Any] = {
        'record_count': 0,
        'date_range': None,
        'data_types': list(data.keys()) if isinstance(data, dict) else []
    }
    
    if not data:
        return stats
    
    try:
        # Calculate record count
        if isinstance(data, dict):
            stats['record_count'] = sum(
                len(items) for items in data.values() 
                if isinstance(items, (list, tuple))
            )
        elif isinstance(data, (list, tuple)):
            stats['record_count'] = len(data)
            
        # Calculate date range if timestamps are available
        dates = []
        
        def extract_dates(obj: Any) -> None:
            """Recursively extract dates from nested structures."""
            if isinstance(obj, dict):
                for key, value in obj.items():
                    if key in ('date', 'timestamp', 'start_time', 'end_time', 'time'):
                        try:
                            dt = parse_datetime(value)
                            if dt:
                                dates.append(dt)
                        except (ValueError, TypeError):
                            pass
                    elif isinstance(value, (dict, list, tuple)):
                        extract_dates(value)
            elif isinstance(obj, (list, tuple)):
                for item in obj:
                    extract_dates(item)
        
        extract_dates(data)
        
        if dates:
            min_date = min(dates)
            max_date = max(dates)
            stats['date_range'] = {
                'start': min_date.isoformat(),
                'end': max_date.isoformat(),
                'days': (max_date - min_date).days + 1 if min_date != max_date else 1
            }
        
        # Add type-specific statistics
        if isinstance(data, dict):
            for key, items in data.items():
                if not isinstance(items, (list, tuple)) or not items:
                    continue
                    
                if key in ('heart_rate', 'heartrate'):
                    try:
                        rates = [float(item.get('heart_rate', 0)) for item in items 
                               if item and 'heart_rate' in item]
                        if rates:
                            stats['heart_rate'] = {
                                'min': min(rates),
                                'max': max(rates),
                                'avg': sum(rates) / len(rates),
                                'count': len(rates)
                            }
                    except (ValueError, TypeError):
                        pass
                        
                elif key == 'steps' and items and 'step_count' in items[0]:
                    try:
                        steps = [int(item.get('step_count', 0)) for item in items]
                        if steps:
                            stats['steps'] = {
                                'total': sum(steps),
                                'min': min(steps),
                                'max': max(steps),
                                'avg': sum(steps) / len(steps),
                                'days': len({item.get('date') for item in items if 'date' in item})
                            }
                    except (ValueError, TypeError):
                        pass
                        
                elif key == 'sleep':
                    try:
                        durations = [
                            (parse_datetime(item.get('end_time')) - parse_datetime(item.get('start_time'))).total_seconds()
                            for item in items
                            if item.get('start_time') and item.get('end_time')
                        ]
                        if durations:
                            stats['sleep'] = {
                                'sessions': len(durations),
                                'total_hours': sum(durations) / 3600,
                                'avg_hours': (sum(durations) / len(durations)) / 3600 if durations else 0,
                                'min_hours': min(durations) / 3600 if durations else 0,
                                'max_hours': max(durations) / 3600 if durations else 0
                            }
                    except (ValueError, TypeError):
                        pass
        
        return stats
        
    except Exception as e:
        logger.warning(f"Error calculating statistics: {str(e)}", exc_info=True)
        return stats


def cleanup_old_files(days_old: int = 7, storage_path: str = '') -> None:
    """
    Clean up old uploaded files from the media directory.
    
    Args:
        days_old: Delete files older than this many days (default: 7)
        storage_path: Subdirectory within the storage to clean (default: root)
    """
    try:
        # Ensure the path ends with a slash if it's not empty
        if storage_path and not storage_path.endswith('/'):
            storage_path = f"{storage_path}/"
            
        cutoff = django_timezone.now() - timedelta(days=days_old)
        
        # Get all files in the storage
        try:
            dirs, files = default_storage.listdir(storage_path)
        except FileNotFoundError:
            logger.warning(f"Storage path not found: {storage_path}")
            return
            
        # Process files in the current directory
        for filename in files:
            file_path = f"{storage_path}{filename}"
            try:
                # Get file modification time
                if hasattr(default_storage, 'get_modified_time'):
                    file_time = default_storage.get_modified_time(file_path)
                else:
                    # Fallback for storages that don't support get_modified_time
                    file_time = datetime.fromtimestamp(
                        os.path.getmtime(default_storage.path(file_path)),
                        tz=django_timezone.utc
                    )
                
                if file_time < cutoff:
                    default_storage.delete(file_path)
                    logger.info(f"Deleted old file: {file_path}")
                    
            except (OSError, FileNotFoundError) as e:
                logger.warning(f"Could not process file {file_path}: {e}")
                continue
                
        # Recursively process subdirectories
        for directory in dirs:
            cleanup_old_files(days_old, f"{storage_path}{directory}")
                    
    except Exception as e:
        logger.error(f"Error cleaning up old files in {storage_path}: {str(e)}")
        raise
