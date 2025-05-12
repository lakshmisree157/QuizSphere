import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  CircularProgress, 
  Alert, 
  Paper,
  Typography,
  LinearProgress
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios from 'axios';

const PDFUpload = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [progress, setProgress] = useState(0);
  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      setError('');
      setProgress(0);

      const mlResponse = await axios.post(
        `${process.env.REACT_APP_ML_SERVICE_URL}/api/pdf/upload`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000,
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 50) / progressEvent.total);
            setProgress(percentCompleted);
          }
        }
      );

      if (!mlResponse.data.questions || !Array.isArray(mlResponse.data.questions)) {
        throw new Error('Invalid response from ML service');
      }

      const backendResponse = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/questions`,
        { questions: mlResponse.data.questions },
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );

      setSuccess(`Successfully generated ${mlResponse.data.totalQuestions} questions!`);
      setProgress(100);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to upload PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Upload PDF
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <input
          accept=".pdf"
          type="file"
          onChange={(e) => {
            setFile(e.target.files[0]);
            setError('');
            setSuccess('');
          }}
          style={{ display: 'none' }}
          id="pdf-upload"
        />
        <label htmlFor="pdf-upload">
          <Button
            variant="outlined"
            component="span"
            startIcon={<CloudUploadIcon />}
            fullWidth
          >
            Select PDF
          </Button>
        </label>
        
        {file && (
          <Typography variant="body2" color="textSecondary">
            Selected file: {file.name}
          </Typography>
        )}

        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!file || loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Upload'}
        </Button>
      </Box>

      {loading && (
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="body2" color="textSecondary" align="center">
            {progress}% Uploaded
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default PDFUpload;