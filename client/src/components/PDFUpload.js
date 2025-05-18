import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, Typography, Box, Button, 
  LinearProgress, Alert, Paper, TextField 
} from '@mui/material';

const PDFUpload = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [testName, setTestName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF file first');
      return;
    }

    if (!testName.trim()) {
      setError('Please enter a test name');
      return;
    }

    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('testName', testName.trim());

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/questions/upload`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          }
        }
      );

      if (response.data.success) {
        navigate('/dashboard');
      } else {
        throw new Error(response.data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.error || 'Failed to upload PDF');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Upload PDF
        </Typography>

        <Paper elevation={3} sx={{ p: 4, mt: 3 }}>
          <TextField
            fullWidth
            label="Test Name"
            variant="outlined"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            disabled={uploading}
            sx={{ mb: 3 }}
          />

          <Paper 
            elevation={0}
            sx={{ 
              p: 3,
              mb: 3,
              border: '2px dashed #ccc',
              borderRadius: 2,
              backgroundColor: '#fafafa'
            }}
          >
            <input
              accept="application/pdf"
              style={{ display: 'none' }}
              id="pdf-upload"
              type="file"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <label htmlFor="pdf-upload">
              <Button
                variant="contained"
                component="span"
                fullWidth
                disabled={uploading}
                sx={{ py: 2 }}
              >
                Select PDF File
              </Button>
            </label>
          </Paper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {file && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1">
                Selected file: {file.name}
              </Typography>
            </Box>
          )}

          {uploading && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Upload progress: {progress}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ mt: 1 }}
              />
            </Box>
          )}

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={!file || !testName.trim() || uploading}
              fullWidth
            >
              {uploading ? 'Uploading...' : 'Upload PDF'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/dashboard')}
              disabled={uploading}
            >
              Cancel
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default PDFUpload;