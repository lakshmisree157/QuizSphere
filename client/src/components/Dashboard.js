import React from 'react';
import { Container, Typography, Button, Box, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Container>
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome, {user?.username}
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Button 
            variant="contained" 
            onClick={() => navigate('/quiz')}
            size="large"
            fullWidth
          >
            Create New Quiz
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Dashboard;