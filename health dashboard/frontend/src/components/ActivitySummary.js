import React from 'react';
import { 
  Typography, 
  Paper, 
  Divider, 
  useTheme,
  Box,
  Stack,
  Grid,
  alpha
} from '@mui/material';
import { 
  EmojiEvents as TrophyIcon,
  DirectionsRun as RunIcon,
  LocalFireDepartment as FireIcon,
  Terrain as TerrainIcon,
  Timer as TimerIcon
} from '@mui/icons-material';

const ActivitySummary = ({ summary = {} }) => {
  const theme = useTheme();
  
  const { 
    best_day, 
    avg_steps = 0, 
    avg_calories = 0, 
    avg_distance_km = 0, 
    avg_active_minutes = 0,
    // chart_data is part of the summary prop but not used directly in this component
    ..._rest // eslint-disable-line no-unused-vars
  } = summary;

  const stats = [
    {
      icon: <RunIcon color="primary" />,
      primary: 'Daily Average Steps',
      secondary: Math.round(avg_steps).toLocaleString(),
    },
    {
      icon: <FireIcon color="secondary" />,
      primary: 'Daily Calories',
      secondary: Math.round(avg_calories).toLocaleString(),
    },
    {
      icon: <TerrainIcon sx={{ color: theme.palette.warning.main }} />,
      primary: 'Daily Distance',
      secondary: `${avg_distance_km.toFixed(2)} km`,
    },
    {
      icon: <TimerIcon sx={{ color: theme.palette.success.main }} />,
      primary: 'Active Time',
      secondary: `${Math.floor(avg_active_minutes / 60)}h ${Math.round(avg_active_minutes % 60)}m`,
    },
  ];

  const bestDayStats = [
    { label: 'Steps', value: best_day?.steps ? best_day.steps.toLocaleString() : '0' },
    { label: 'Distance', value: best_day?.distance_km ? `${best_day.distance_km.toFixed(2)} km` : '0 km' },
    { label: 'Calories', value: best_day?.calories ? Math.round(best_day.calories).toLocaleString() : '0' },
  ];

  return (
    <Paper elevation={3} sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TrophyIcon color="primary" sx={{ mr: 1.5, fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Activity Summary</Typography>
        </Box>
        
        {best_day?.date ? (
          <Box sx={{ 
            backgroundColor: alpha(theme.palette.primary.main, 0.08), 
            borderRadius: 2, 
            p: 2,
            mb: 2
          }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Best Day: {new Date(best_day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </Typography>
            <Grid container spacing={1}>
              {bestDayStats.map((stat, index) => (
                <Grid item xs={4} key={index}>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {stat.label}
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {stat.value}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            No best day data available
          </Typography>
        )}
      </Box>
      
      <Divider sx={{ my: 1 }} />
      
      <Box sx={{ mt: 2, flex: 1 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
          AVERAGE DAILY ACTIVITY
        </Typography>
        
        <Stack spacing={2}>
          {stats.map((stat, index) => (
            <Box 
              key={index} 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                p: 1.5,
                borderRadius: 2,
                backgroundColor: 'background.default',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateX(4px)',
                  boxShadow: theme.shadows[1]
                }
              }}
            >
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                mr: 2,
                '& .MuiSvgIcon-root': {
                  fontSize: 20
                }
              }}>
                {stat.icon}
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {stat.primary}
                </Typography>
                <Typography variant="h6" fontWeight={600}>
                  {stat.secondary}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      </Box>
    </Paper>
  );
};

export default ActivitySummary;
