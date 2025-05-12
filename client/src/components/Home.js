import React from 'react';
import { Box, Button, Container, Typography, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(6),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  background: 'rgba(255, 255, 255, 0.9)',
  borderRadius: '15px'
}));

const Home = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
        py: 8
      }}
    >
      <Container maxWidth="sm">
        <StyledPaper elevation={3}>
          <Typography
            component="h1"
            variant="h3"
            gutterBottom
            color="primary"
            sx={{ mb: 4 }}
          >
            Adaptive Quiz
          </Typography>
          <Typography variant="h6" color="textSecondary" align="center" sx={{ mb: 4 }}>
            Generate and take quizzes based on your learning materials
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="large"
              onClick={() => navigate('/register')}
            >
              Register
            </Button>
          </Box>
        </StyledPaper>
      </Container>
    </Box>
  );
};

export default Home;