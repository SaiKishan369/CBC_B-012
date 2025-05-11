import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography,
} from '@mui/material';

interface WellbeingResponseProps {}

const WellbeingResponse: React.FC<WellbeingResponseProps> = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/mental-health-support/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate response');
      }

      setResponse(data.generated_text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Mental Health Support Chat
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Share your thoughts, feelings, or concerns, and receive supportive guidance.
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            label="Share your thoughts or concerns"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || !prompt.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Get Support
          </Button>
        </form>

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </Paper>

      {response && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Support Response
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {response}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default WellbeingResponse; 