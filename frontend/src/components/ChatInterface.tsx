import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, Button, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { styled } from '@mui/material/styles';
import { Theme } from '@mui/material/styles';

const ChatContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.default,
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflowY: 'auto',
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1),
}));

interface MessageBubbleProps {
  isUser: boolean;
}

const MessageBubble = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isUser',
})<MessageBubbleProps>(({ theme, isUser }: { theme: Theme; isUser: boolean }) => ({
  maxWidth: '70%',
  padding: theme.spacing(1.5),
  marginBottom: theme.spacing(1),
  borderRadius: theme.spacing(2),
  backgroundColor: isUser ? theme.palette.primary.main : theme.palette.grey[100],
  color: isUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  marginLeft: isUser ? 'auto' : 0,
  marginRight: isUser ? 0 : 'auto',
  wordWrap: 'break-word',
}));

const InputContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(1),
}));

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      text: input,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: input }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from the server');
      }

      const data = await response.json();
      
      const aiMessage: Message = {
        text: data.generated_text,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <ChatContainer elevation={3}>
      <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', color: 'primary.main' }}>
      Sentio Assistant- Your Mental Health Assistant
      </Typography>
      
      <MessagesContainer>
        {messages.map((message, index) => (
          <MessageBubble key={index} isUser={message.isUser}>
            <Typography variant="body1">{message.text}</Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.7 }}>
              {message.timestamp.toLocaleTimeString()}
            </Typography>
          </MessageBubble>
        ))}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <div ref={messagesEndRef} />
      </MessagesContainer>

      <InputContainer>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message here..."
          variant="outlined"
          disabled={isLoading}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'background.paper',
            },
          }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          endIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
        >
          Send
        </Button>
      </InputContainer>
    </ChatContainer>
  );
};

export default ChatInterface; 