import React from 'react';
import { Grid, Typography, Paper, Box, Divider, Stack, Card, CardContent, Avatar } from '@mui/material';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import MapIcon from '@mui/icons-material/Map';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const statCards = [
  {
    label: 'Daily Steps',
    value: '0',
    icon: <DirectionsWalkIcon fontSize="large" color="primary" />, 
    color: 'primary.main',
  },
  {
    label: 'Calories Burned',
    value: '0',
    icon: <LocalFireDepartmentIcon fontSize="large" color="error" />, 
    color: 'error.main',
  },
  {
    label: 'Distance',
    value: '0 km',
    icon: <MapIcon fontSize="large" color="success" />, 
    color: 'success.main',
  },
  {
    label: 'Best Day',
    value: '-',
    icon: <EmojiEventsIcon fontSize="large" color="warning" />, 
    color: 'warning.main',
  },
];

const DashboardPage = () => {
  return (
    <Box sx={{ mt: 4, mb: 4 }}>
      {/* Hero Section */}
      <Paper elevation={3} sx={{ p: { xs: 3, md: 6 }, mb: 4, borderRadius: 4, background: 'linear-gradient(90deg, #e0f7fa 0%, #ffffff 100%)' }}>
        <Typography variant="h3" align="center" gutterBottom fontWeight={700} color="primary.dark">
          Health Dashboard
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" gutterBottom>
          Track your daily activity, calories, and more. Upload your health data to see your personalized stats.
        </Typography>
      </Paper>

      {/* Stat Cards */}
      <Grid container spacing={3} justifyContent="center">
        {statCards.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.label}>
            <Card elevation={2} sx={{ borderRadius: 3, textAlign: 'center', py: 3 }}>
              <CardContent>
                <Avatar sx={{ bgcolor: stat.color, width: 56, height: 56, margin: '0 auto', mb: 2 }}>
                  {stat.icon}
                </Avatar>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {stat.label}
                </Typography>
                <Typography variant="h4" color="primary" fontWeight={700}>
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* No Data Message */}
      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No data available. Upload your health data to see charts and insights.
        </Typography>
      </Box>
    </Box>
  );
};

export default DashboardPage;
