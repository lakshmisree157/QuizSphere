import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import PDFUpload from './PDFUpload';

const Quiz = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom>
           Quiz Generator
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
          Upload a file to generate questions
        </Typography>
        
        <PDFUpload />
      </Box>
    </Container>
  );
};

export default Quiz;