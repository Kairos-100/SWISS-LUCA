import { createTheme } from '@mui/material/styles';

// Paleta de colores profesional y moderna
const professionalTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FFD700', // Dorado elegante
      light: '#FFF176',
      dark: '#F57F17',
      contrastText: '#000000',
    },
    secondary: {
      main: '#FFD700', // Azul profesional
      light: '#FFA000',
      dark: '#FFF176',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#0F0F0F', // Negro profundo
      paper: '#1A1A1A', // Gris muy oscuro
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B0B0B0',
    },
    error: {
      main: '#F44336',
      light: '#EF5350',
      dark: '#D32F2F',
    },
    warning: {
      main: '#FF9800',
      light: '#FFB74D',
      dark: '#F57C00',
    },
    success: {
      main: '#4CAF50',
      light: '#81C784',
      dark: '#388E3C',
    },
    info: {
      main: '#FFD700',
      light: '#FFA000',
      dark: '#FFF176',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      fontWeight: 400,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      fontWeight: 400,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.02em',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
      fontWeight: 400,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 24px',
          fontSize: '0.875rem',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
            transform: 'translateY(-2px)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
          color: '#000000',
          '&:hover': {
            background: 'linear-gradient(135deg, #FFA000 0%, #FF8F00 100%)',
          },
        },
        outlined: {
          borderColor: '#FFD700',
          color: '#FFD700',
          '&:hover': {
            borderColor: '#FFA000',
            backgroundColor: 'rgba(255, 215, 0, 0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: 'linear-gradient(145deg, #1A1A1A 0%, #2A2A2A 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
            borderColor: 'rgba(255, 215, 0, 0.3)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: '0 4px',
          minHeight: 48,
          textTransform: 'none',
          fontWeight: 600,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&.Mui-selected': {
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
            color: '#000000',
            boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
          },
          '&:hover': {
            backgroundColor: 'rgba(255, 215, 0, 0.1)',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          background: 'rgba(26, 26, 26, 0.8)',
          borderRadius: 16,
          padding: '4px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        indicator: {
          display: 'none',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: 'rgba(255, 215, 0, 0.1)',
            transform: 'scale(1.05)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          fontWeight: 500,
          background: 'rgba(255, 215, 0, 0.1)',
          color: '#FFD700',
          border: '1px solid rgba(255, 215, 0, 0.3)',
          '&:hover': {
            background: 'rgba(255, 215, 0, 0.2)',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          background: 'linear-gradient(145deg, #1A1A1A 0%, #2A2A2A 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(20px)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              borderColor: 'rgba(255, 215, 0, 0.5)',
            },
            '&.Mui-focused': {
              borderColor: '#FFD700',
              boxShadow: '0 0 0 2px rgba(255, 215, 0, 0.2)',
            },
          },
        },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          '& .MuiSnackbarContent-root': {
            borderRadius: 12,
            background: 'linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
        },
        standardSuccess: {
          background: 'rgba(76, 175, 80, 0.1)',
          borderColor: 'rgba(76, 175, 80, 0.3)',
          color: '#4CAF50',
        },
        standardError: {
          background: 'rgba(244, 67, 54, 0.1)',
          borderColor: 'rgba(244, 67, 54, 0.3)',
          color: '#F44336',
        },
        standardWarning: {
          background: 'rgba(255, 152, 0, 0.1)',
          borderColor: 'rgba(255, 152, 0, 0.3)',
          color: '#FF9800',
        },
        standardInfo: {
          background: 'rgba(33, 150, 243, 0.1)',
          borderColor: 'rgba(33, 150, 243, 0.3)',
          color: '#FFD700',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          height: 8,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
        bar: {
          borderRadius: 10,
          background: 'linear-gradient(90deg, #FFD700 0%, #FFA000 100%)',
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: '#FFD700',
        },
      },
    },
  },
});

export default professionalTheme;

