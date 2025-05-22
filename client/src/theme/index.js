import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5', // pleasant blue
      light: '#6573c3',
      dark: '#2c387e',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#4caf50', // pleasant green
      light: '#80e27e',
      dark: '#087f23',
      contrastText: '#ffffff'
    },
    background: {
      default: '#f0f4f8', // soft light gray-blue
      paper: '#ffffff'
    },
    success: {
      main: '#4caf50',
      light: '#80e27e',
      dark: '#087f23'
    },
    error: {
      main: '#f44336',
      light: '#ff7961',
      dark: '#ba000d'
    },
    info: {
      main: '#2196f3',
      light: '#6ec6ff',
      dark: '#0069c0'
    },
    warning: {
      main: '#ff9800',
      light: '#ffc947',
      dark: '#c66900'
    }
  },
  shape: {
    borderRadius: 8
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      letterSpacing: 0.5
    },
    h5: {
      fontWeight: 500,
      letterSpacing: 0.5
    },
    h6: {
      fontWeight: 500
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
          padding: '8px 24px',
          transition: 'all 0.3s ease'
        },
        containedPrimary: {
          backgroundColor: '#3f51b5',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#2c387e',
            boxShadow: '0 6px 20px rgba(63, 81, 181, 0.4)'
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
          borderRadius: 12,
          transition: 'transform 0.3s ease'
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: '#e3eaf2'
        }
      }
    }
  }
});

export default theme;
