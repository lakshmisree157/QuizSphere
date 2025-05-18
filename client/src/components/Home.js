import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  Grid
} from '@mui/material';

const Home = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg">
      <Box sx={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        py: 8
      }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography 
              variant="h2" 
              component="h1" 
              gutterBottom 
              sx={{ 
                fontWeight: 700,
                color: 'primary.main'
              }}
            >
              Adaptive Quiz Platform
            </Typography>
            <Typography variant="h5" color="text.secondary" paragraph>
              Transform your PDF documents into interactive quizzes with AI-powered question generation
            </Typography>
            <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/register')}
                sx={{ px: 4 }}
              >
                Get Started
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/login')}
                sx={{ px: 4 }}
              >
                Sign In
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={3}
              sx={{
                p: 4,
                bgcolor: 'background.paper',
                borderRadius: 2
              }}
            >
              <Typography variant="h6" gutterBottom color="primary">
                Key Features
              </Typography>
              <Box component="ul" sx={{ mt: 2, pl: 2 }}>
                <Typography component="li" sx={{ mb: 1 }}>
                  AI-powered question generation from PDF documents
                </Typography>
                <Typography component="li" sx={{ mb: 1 }}>
                  Interactive quiz interface with instant feedback
                </Typography>
                <Typography component="li" sx={{ mb: 1 }}>
                  Detailed performance analytics and progress tracking
                </Typography>
                <Typography component="li" sx={{ mb: 1 }}>
                  Multiple attempts allowed for better learning
                </Typography>
                <Typography component="li">
                  Secure and user-friendly platform
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Home;