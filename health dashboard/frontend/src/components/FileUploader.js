import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  LinearProgress, 
  Alert,
  Snackbar,
  useTheme
} from '@mui/material';
import { CloudUpload, InsertDriveFile } from '@mui/icons-material';
import axios from 'axios';

const FileUploader = ({ onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const theme = useTheme();

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip'],
      'application/json': ['.json'],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      const response = await axios.post('/api/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setUploadProgress(progress);
        },
      });

      setSuccess(true);
      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError(
        err.response?.data?.message || 
        'Failed to upload file. Please try again.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccess(false);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto', my: 4 }}>
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          border: `2px dashed ${theme.palette.divider}`,
          borderRadius: 2,
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragActive 
            ? theme.palette.action.hover 
            : theme.palette.background.paper,
          transition: 'background-color 0.2s ease',
          mb: 2,
        }}
      >
        <input {...getInputProps()} />
        <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Drop the file here' : 'Drag & drop a file here, or click to select'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Supported formats: .zip, .json, .csv, .xls, .xlsx
        </Typography>
      </Paper>

      {selectedFile && (
        <Paper 
          elevation={1} 
          sx={{ 
            p: 2, 
            mb: 2, 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <InsertDriveFile sx={{ mr: 2, color: 'primary.main' }} />
            <Box>
              <Typography variant="subtitle1">
                {selectedFile.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </Typography>
            </Box>
          </Box>
          <Button 
            variant="outlined" 
            color="error"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFile(null);
            }}
          >
            Remove
          </Button>
        </Paper>
      )}

      {isUploading && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress 
            variant={uploadProgress === 0 ? 'indeterminate' : 'determinate'} 
            value={uploadProgress} 
          />
          <Typography variant="caption" color="text.secondary">
            Uploading... {uploadProgress}%
          </Typography>
        </Box>
      )}

      <Button
        variant="contained"
        color="primary"
        fullWidth
        size="large"
        onClick={handleUpload}
        disabled={!selectedFile || isUploading}
      >
        {isUploading ? 'Uploading...' : 'Upload & Process'}
      </Button>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          File uploaded and processed successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FileUploader;
