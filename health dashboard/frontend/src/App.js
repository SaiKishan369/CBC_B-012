import React, { useState, useEffect } from 'react';
import { 
  ThemeProvider, 
  createTheme, 
  Container, 
  Typography, 
  AppBar, 
  Toolbar, 
  Box,
  CssBaseline,
  useMediaQuery,
  Button,
  Tabs,
  Tab
} from '@mui/material';
import { teal, deepOrange, blueGrey } from '@mui/material/colors';
import { 
  LocalHospital as HealthIcon, 
  Upload as UploadIcon, 
  Dashboard as DashboardIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon
} from '@mui/icons-material';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import UploadDataPage from './pages/UploadDataPage';
import { fetchDashboardData } from './services/api';

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          primary: teal,
          secondary: deepOrange,
          background: {
            default: blueGrey[50],
            paper: '#ffffff',
          },
          text: {
            primary: blueGrey[900],
            secondary: blueGrey[700],
          },
        }
      : {
          primary: teal,
          secondary: deepOrange,
          background: {
            default: blueGrey[900],
            paper: blueGrey[800],
          },
          text: {
            primary: '#ffffff',
            secondary: blueGrey[200],
          },
        }),
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.2,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.2,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.2,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.2,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.1rem',
      lineHeight: 1.2,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

const Navigation = ({ darkMode, toggleDarkMode }) => {
  const location = useLocation();
  const [tabValue, setTabValue] = React.useState(location.pathname === '/upload' ? 1 : 0);

  React.useEffect(() => {
    setTabValue(location.pathname === '/upload' ? 1 : 0);
  }, [location]);

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <HealthIcon sx={{ mr: 2 }} color="primary" />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Health Dashboard
        </Typography>
        <Tabs 
          value={tabValue} 
          indicatorColor="primary"
          textColor="primary"
          sx={{ mr: 2 }}
        >
          <Tab 
            label="Dashboard" 
            component={Link} 
            to="/" 
            icon={<DashboardIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Upload Data" 
            component={Link} 
            to="/upload" 
            icon={<UploadIcon />}
            iconPosition="start"
          />
        </Tabs>
        <Button 
          color="inherit" 
          onClick={toggleDarkMode}
          variant="outlined"
          size="small"
          startIcon={darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          sx={{ ml: 2 }}
        >
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </Button>
      </Toolbar>
    </AppBar>
  );
};

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [darkMode, setDarkMode] = useState(prefersDarkMode);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const theme = React.useMemo(
    () => createTheme(getDesignTokens(darkMode ? 'dark' : 'light')),
    [darkMode]
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchDashboardData();
        setData(result);
      } catch (err) {
        setError('Failed to load dashboard data. Please try again later.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
          <Navigation darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <Routes>
              <Route 
                path="/" 
                element={
                  <DashboardPage 
                    data={data} 
                    loading={loading} 
                    error={error} 
                  />
                } 
              />
              <Route 
                path="/upload" 
                element={<UploadDataPage />} 
              />
            </Routes>
          </Container>
          <Box 
            component="footer"
            sx={{ 
              py: 3, 
              mt: 'auto',
              bgcolor: 'background.paper',
              borderTop: `1px solid ${theme.palette.divider}`
            }}
          >
            <Container maxWidth="xl">
              <Typography variant="body2" color="text.secondary" align="center">
                Health Dashboard {new Date().getFullYear()}
              </Typography>
            </Container>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
