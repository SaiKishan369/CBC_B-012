import os
import json
import tempfile
from datetime import datetime, timezone, timedelta
from unittest import TestCase, mock
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.files.storage import default_storage
from django.test import override_settings
from django.core.exceptions import ValidationError
from django.conf import settings

from ..utils import (
    parse_datetime,
    validate_file,
    process_health_data,
    save_uploaded_file,
    cleanup_old_files,
    calculate_statistics,
)


class TestHealthDataUtils(TestCase):
    def setUp(self):
        self.test_file_content = b'{"test": "data"}'
        self.test_file = SimpleUploadedFile(
            'test.json',
            self.test_file_content,
            content_type='application/json'
        )
        
        # Create a test media directory
        self.test_media = tempfile.mkdtemp()
        
    def tearDown(self):
        # Clean up test files
        if os.path.exists(self.test_media):
            for root, dirs, files in os.walk(self.test_media, topdown=False):
                for name in files:
                    os.remove(os.path.join(root, name))
                for name in dirs:
                    os.rmdir(os.path.join(root, name))
            os.rmdir(self.test_media)
    
    def test_parse_datetime(self):
        # Test with ISO 8601 format with timezone
        dt = parse_datetime('2023-05-15T12:34:56+00:00')
        self.assertEqual(dt.isoformat(), '2023-05-15T12:34:56+00:00')
        
        # Test with ISO 8601 without timezone
        dt = parse_datetime('2023-05-15T12:34:56')
        self.assertEqual(dt.tzinfo, timezone.utc)
        
        # Test with Unix timestamp (seconds)
        dt = parse_datetime(1684154096)
        self.assertIsNotNone(dt)
        
        # Test with Unix timestamp (milliseconds)
        dt = parse_datetime(1684154096123)
        self.assertIsNotNone(dt)
        
        # Test with None/empty
        self.assertIsNone(parse_datetime(None))
        self.assertIsNone(parse_datetime(''))
    
    @override_settings(MEDIA_ROOT=tempfile.mkdtemp())
    def test_validate_file(self):
        # Test valid file
        file_info = validate_file(self.test_file)
        self.assertEqual(file_info['name'], 'test.json')
        self.assertEqual(file_info['extension'], '.json')
        
        # Test file size validation
        large_file = SimpleUploadedFile(
            'large.json',
            b'x' * (50 * 1024 * 1024 + 1),  # 50MB + 1 byte
            content_type='application/json'
        )
        
        # The validation should fail because the file is too large
        with self.assertRaises(ValidationError):
            validate_file(large_file, max_size=50 * 1024 * 1024)  # 50MB limit
    
    def test_calculate_statistics(self):
        # Test with heart rate data
        heart_rate_data = {
            'heart_rate': [
                {'heart_rate': 70, 'timestamp': '2023-05-15T12:00:00Z'},
                {'heart_rate': 75, 'timestamp': '2023-05-15T12:01:00Z'},
                {'heart_rate': 80, 'timestamp': '2023-05-15T12:02:00Z'},
            ]
        }
        
        stats = calculate_statistics(heart_rate_data)
        self.assertEqual(stats['record_count'], 3)
        self.assertEqual(stats['heart_rate']['min'], 70)
        self.assertEqual(stats['heart_rate']['max'], 80)
        self.assertAlmostEqual(stats['heart_rate']['avg'], 75.0)
        
        # Test with steps data
        steps_data = {
            'steps': [
                {'step_count': 5000, 'date': '2023-05-15'},
                {'step_count': 7500, 'date': '2023-05-16'},
                {'step_count': 10000, 'date': '2023-05-17'},
            ]
        }
        
        stats = calculate_statistics(steps_data)
        self.assertEqual(stats['steps']['total'], 22500)
        self.assertEqual(stats['steps']['days'], 3)
    
    @override_settings(MEDIA_ROOT=tempfile.mkdtemp())
    def test_save_uploaded_file(self):
        # Test saving a file
        result = save_uploaded_file(self.test_file)
        self.assertIn('url', result)
        self.assertIn('path', result)
        self.assertIn('name', result)
        self.assertIn('size', result)
        
        # Verify the file exists
        self.assertTrue(default_storage.exists(result['path']))
    
    @override_settings(MEDIA_ROOT=tempfile.mkdtemp())
    def test_cleanup_old_files(self):
        # Create a test directory
        test_dir = os.path.join(settings.MEDIA_ROOT, 'test_cleanup')
        os.makedirs(test_dir, exist_ok=True)
        
        # Create an old file
        old_file_path = os.path.join(test_dir, 'old.txt')
        with open(old_file_path, 'w') as f:
            f.write('old content')
        
        # Create a new file
        new_file_path = os.path.join(test_dir, 'new.txt')
        with open(new_file_path, 'w') as f:
            f.write('new content')
        
        # Set the old file's modification time to be 8 days ago
        old_time = datetime.now(timezone.utc) - timedelta(days=8)
        os.utime(old_file_path, (old_time.timestamp(), old_time.timestamp()))
        
        # Verify files exist before cleanup
        self.assertTrue(os.path.exists(old_file_path))
        self.assertTrue(os.path.exists(new_file_path))
        
        # Run cleanup with 7-day threshold
        cleanup_old_files(days_old=7, storage_path='test_cleanup')
        
        # Verify old file was deleted, new file still exists
        self.assertFalse(os.path.exists(old_file_path))
        self.assertTrue(os.path.exists(new_file_path))
    
    def test_process_health_data(self):
        # Test with valid JSON data
        json_content = json.dumps({
            'data': {
                'heart_rate': [
                    {'heart_rate': 70, 'start_time': '2023-05-15T12:00:00Z'},
                    {'heart_rate': 75, 'start_time': '2023-05-15T12:01:00Z'},
                ]
            }
        }).encode('utf-8')
        
        json_file = SimpleUploadedFile(
            'test.json',
            json_content,
            content_type='application/json'
        )
        
        result = process_health_data(json_file)
        self.assertEqual(result['metadata']['file_type'], 'json')
        self.assertEqual(result['stats']['record_count'], 2)
        self.assertIn('heart_rate', result['data'])
        self.assertEqual(len(result['data']['heart_rate']), 2)
