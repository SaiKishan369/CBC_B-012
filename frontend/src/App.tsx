import React, { useState } from 'react';
import { 
  Container, 
  TextField, 
  Button, 
  Paper, 
  Typography, 
  Box,
  CircularProgress,
  ThemeProvider,
  createTheme,
  CssBaseline,
  useMediaQuery,
  AppBar,
  Toolbar
} from '@mui/material';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import WellbeingResponse from './components/WellbeingResponse';
import WellbeingRoadmap from './components/WellbeingRoadmap';

// Create a custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#4a90e2',
      light: '#6ba7e7',
      dark: '#357abd',
    },
    secondary: {
      main: '#2c3e50',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.5px',
    },
    subtitle1: {
      fontWeight: 400,
      letterSpacing: '0.15px',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          padding: '10px 24px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        },
      },
    },
  },
});

function App() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResponse('');

    try {
      const result = await axios.post('http://localhost:8000/api/mental-health-support/', {
        prompt: prompt
      });
      setResponse(result.data.generated_text || 'No response generated');
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.response?.data?.error || 'An error occurred while processing your request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Router>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Sentio Assistant
            </Typography>
            <Button color="inherit" component={Link} to="/">
              Chat
            </Button>
            <Button color="inherit" component={Link} to="/roadmap">
              Roadmap
            </Button>
          </Toolbar>
        </AppBar>

        <Container sx={{ mt: 4 }}>
          <Routes>
            <Route path="/" element={<WellbeingResponse />} />
            <Route path="/roadmap" element={<WellbeingRoadmap />} />
          </Routes>
        </Container>
      </Box>
    </Router>
  );
}

export default App; 