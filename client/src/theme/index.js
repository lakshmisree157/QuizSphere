import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2C3E50',
      light: '#34495E',
      dark: '#1A252F',
      contrastText: '#ECF0F1'
    },
    secondary: {
      main: '#E74C3C',
      light: '#F75C4C',
      dark: '#C0392B',
      contrastText: '#FFFFFF'
    },
    background: {
      default: '#F5F6FA',
      paper: '#FFFFFF'
    },
    success: {
      main: '#2ECC71',
      light: '#55D98D',
      dark: '#27AE60'
    },
    error: {
      main: '#E74C3C',
      light: '#FF6B6B',
      dark: '#C0392B'
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
          padding: '8px 24px'
        },
        containedPrimary: {
          '&:hover': {
            boxShadow: '0 4px 12px rgba(44, 62, 80, 0.2)'
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)'
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: '#F8FAFC'
        }
      }
    }
  }
});

export default theme;